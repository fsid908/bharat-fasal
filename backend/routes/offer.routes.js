import express from "express";
import Offer from "../models/offer.model.js";
import Lot from "../models/lot.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";
const router = express.Router();

/* =========================================================
   CREATE OFFER
   POST /api/offers
   Buyer only
========================================================= */
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can create offers.",
      });
    }

    const { lotId, offeredPrice } = req.body;

    const price = Number(offeredPrice);

    if (!lotId || !price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Lot ID and a valid offered price are required.",
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
      verified: true,
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Verified buyer profile not found.",
      });
    }

    const lot = await Lot.findOne({ id: lotId });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found.",
      });
    }

    if (lot.status !== "listed") {
      return res.status(400).json({
        success: false,
        message: "This lot is no longer available.",
      });
    }

    if (String(lot.sellerId) === String(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot make an offer on your own lot.",
      });
    }

    if (price > Number(lot.expectedPrice)) {
      return res.status(400).json({
        success: false,
        message: `Offer price cannot be higher than the expected price of ₹${lot.expectedPrice}.`,
      });
    }

    const existingOffer = await Offer.findOne({
      lotId,
      buyerId: String(buyer.id),
      status: "pending",
    });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending offer for this lot.",
        offer: existingOffer,
      });
    }

    const offer = await Offer.create({
      offerId: `BF-OFFER-${Date.now()}`,
      lotId: lot.id,
      buyerId: String(buyer.id),
      buyerName: buyer.name,
      sellerId: String(lot.sellerId),
      sellerName: lot.sellerName,
      commodityId: lot.commodityId,
      quantity: Number(lot.quantity),
      offeredPrice: price,
      totalAmount: Number(lot.quantity) * price,
      status: "pending",
      counterPrice: null,
    });

    return res.status(201).json({
      success: true,
      message: "Offer created successfully.",
      offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create offer.",
    });
  }
});

/* =========================================================
   GET MY OFFERS
   GET /api/offers/my

   Buyer  -> offers created by buyer
   Seller -> offers received on seller's lots
========================================================= */
router.get("/my", protect, async (req, res) => {
  try {
    let offers = [];

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Buyer profile not found.",
        });
      }

      offers = await Offer.find({
        buyerId: String(buyer.id),
      }).sort({ createdAt: -1 });
    } else if (req.user.role === "farmer" || req.user.role === "fpo") {
      offers = await Offer.find({
        sellerId: String(req.user.userId),
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view offers.",
      });
    }

    return res.json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Get offers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch offers.",
    });
  }
});

/* =========================================================
   UPDATE OFFER STATUS
   PATCH /api/offers/:offerId/status

   Seller:
   pending -> accepted
   pending -> rejected
   pending -> countered

   Buyer:
   countered -> accepted
   countered -> rejected
========================================================= */
router.patch("/:offerId/status", protect, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status, counterPrice } = req.body;

    const allowedStatuses = ["accepted", "rejected", "countered"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status.",
      });
    }

    const offer = await Offer.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    /* =====================================================
       SELLER ACTIONS
    ===================================================== */

    if (req.user.role === "farmer" || req.user.role === "fpo") {
      if (String(offer.sellerId) !== String(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this offer.",
        });
      }

      if (offer.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending offers can be updated by the seller.",
        });
      }

      if (status === "countered") {
        const price = Number(counterPrice);

        if (!price || price <= 0) {
          return res.status(400).json({
            success: false,
            message: "A valid counter price is required.",
          });
        }

        offer.counterPrice = price;
      }

      offer.status = status;
await offer.save();

if (status === "accepted") {
  const existingOrder = await Order.findOne({
    offerId: offer.offerId,
  });

  if (!existingOrder) {
    await Order.create({
      orderId: `BF-ORDER-${Date.now()}`,
      offerId: offer.offerId,
      lotId: offer.lotId,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      commodityId: offer.commodityId,
      quantity: offer.quantity,
      pricePerQuintal: offer.offeredPrice,
      totalAmount: offer.totalAmount,
      status: "created",
      paymentStatus: "pending",
      logisticsStatus: "pending",
    });
  }
}

return res.json({
        success: true,
        message:
          status === "accepted"
            ? "Offer accepted successfully."
            : status === "rejected"
              ? "Offer rejected successfully."
              : "Counter offer sent successfully.",
        offer,
      });
    }

    /* =====================================================
       BUYER ACTIONS
       Only countered offers can be accepted/rejected
    ===================================================== */

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Buyer profile not found.",
        });
      }

      if (String(offer.buyerId) !== String(buyer.id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this offer.",
        });
      }

      if (offer.status !== "countered") {
        return res.status(400).json({
          success: false,
          message: "Only countered offers can be responded to by the buyer.",
        });
      }

      if (status === "countered") {
        return res.status(400).json({
          success: false,
          message: "Buyer cannot send a counter from this action.",
        });
      }

      offer.status = status;

if (status === "accepted" && offer.counterPrice) {
  offer.offeredPrice = offer.counterPrice;
  offer.totalAmount =
    Number(offer.quantity) * Number(offer.counterPrice);
}

await offer.save();

if (status === "accepted") {
  const existingOrder = await Order.findOne({
    offerId: offer.offerId,
  });

  if (!existingOrder) {
    await Order.create({
      orderId: `BF-ORDER-${Date.now()}`,
      offerId: offer.offerId,
      lotId: offer.lotId,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      commodityId: offer.commodityId,
      quantity: offer.quantity,
      pricePerQuintal: offer.offeredPrice,
      totalAmount: offer.totalAmount,
      status: "created",
      paymentStatus: "pending",
      logisticsStatus: "pending",
    });
  }
}

return res.json({
        success: true,
        message:
          status === "accepted"
            ? "Counter offer accepted successfully."
            : "Counter offer rejected successfully.",
        offer,
      });
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to update offers.",
    });
  } catch (error) {
    console.error("Update offer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update offer.",
    });
  }
});

export default router;
