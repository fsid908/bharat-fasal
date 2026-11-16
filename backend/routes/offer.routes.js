
import express from "express";
import mongoose from "mongoose";

import Offer from "../models/offer.model.js";
import Lot from "../models/lot.model.js";
import Buyer from "../models/buyer.model.js";
import Order from "../models/order.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// CREATE ORDER FROM ACCEPTED OFFER
const createOrderFromOffer = async (offerId, counterAccepted = false) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const offer = await Offer.findOne({ offerId }).session(session);

      if (!offer) throw new Error("OFFER_NOT_FOUND");

      const expectedStatus = counterAccepted ? "countered" : "pending";

      if (offer.status !== expectedStatus) {
        throw new Error("OFFER_ALREADY_PROCESSED");
      }

      const existingOrder = await Order.findOne({ offerId }).session(session);

      if (existingOrder) throw new Error("ORDER_ALREADY_EXISTS");

      if (counterAccepted) {
        const price = Number(offer.counterPrice);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("INVALID_COUNTER_PRICE");
        }

        offer.offeredPrice = price;
        offer.totalAmount = Number(offer.quantity) * price;
      }

      const lot = await Lot.findOneAndUpdate(
        { id: offer.lotId, status: "listed" },
        { $set: { status: "sold" } },
        { new: true, session }
      );

      if (!lot) throw new Error("LOT_NOT_AVAILABLE");

      const orderId = `BF-ORDER-${new mongoose.Types.ObjectId()}`;

      const [order] = await Order.create(
        [
          {
            orderId,
            offerId: offer.offerId,
            lotId: offer.lotId,
            buyerId: offer.buyerId,
            buyerName: offer.buyerName,
            sellerId: offer.sellerId,
            sellerName: offer.sellerName || lot.sellerName || "Seller",
            commodityId: offer.commodityId,
            quantity: offer.quantity,
            location: lot.pickupLocation || lot.sellerLocation || "",
            transport: lot.transportation || "",
            transportCost: 0,
            pricePerQuintal: offer.offeredPrice,
            totalAmount: offer.totalAmount,
            status: "created",
            paymentStatus: "pending",
            logisticsStatus: "pending"
          }
        ],
        { session }
      );

      offer.status = "accepted";
      await offer.save({ session });

      result = { order, offer };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// CREATE OFFER - BUYER ONLY
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can create offers."
      });
    }

    const { lotId, offeredPrice } = req.body;
    const price = Number(offeredPrice);

    if (
      typeof lotId !== "string" ||
      !lotId.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Lot ID and a valid offered price are required."
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
      verified: true
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Verified buyer profile not found."
      });
    }

    const lot = await Lot.findOne({ id: lotId.trim() });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found."
      });
    }

    if (lot.status !== "listed") {
      return res.status(400).json({
        success: false,
        message: "This lot is no longer available."
      });
    }

    if (String(lot.sellerId) === String(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot make an offer on your own lot."
      });
    }

    if (price > Number(lot.expectedPrice)) {
      return res.status(400).json({
        success: false,
        message: `Offer price cannot be higher than the expected price of ₹${lot.expectedPrice}.`
      });
    }

    const existingOffer = await Offer.findOne({
      lotId: lot.id,
      buyerId: String(buyer.id),
      status: "pending"
    });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending offer for this lot.",
        offer: existingOffer
      });
    }

    const offer = await Offer.create({
      offerId: `BF-OFFER-${new mongoose.Types.ObjectId()}`,
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
      counterPrice: null
    });

    return res.status(201).json({
      success: true,
      message: "Offer created successfully.",
      offer
    });
  } catch (error) {
    console.error("Create offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create offer."
    });
  }
});

// GET MY OFFERS
router.get("/my", protect, async (req, res) => {
  try {
    let offers = [];

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId
      });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Buyer profile not found."
        });
      }

      offers = await Offer.find({
        buyerId: String(buyer.id)
      }).sort({ createdAt: -1 });
    } else if (
      req.user.role === "farmer" ||
      req.user.role === "fpo"
    ) {
      offers = await Offer.find({
        sellerId: String(req.user.userId)
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view offers."
      });
    }

    return res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    console.error("Get offers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch offers."
    });
  }
});

// UPDATE OFFER STATUS
router.patch("/:offerId/status", protect, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status, counterPrice } = req.body;

    const allowedStatuses = ["accepted", "rejected", "countered"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status."
      });
    }

    const offer = await Offer.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found."
      });
    }

    // SELLER ACTIONS
    if (
      req.user.role === "farmer" ||
      req.user.role === "fpo"
    ) {
      if (String(offer.sellerId) !== String(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this offer."
        });
      }

      if (offer.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending offers can be updated by the seller."
        });
      }

      if (status === "accepted") {
        const { offer: updatedOffer } = await createOrderFromOffer(offerId);

        return res.json({
          success: true,
          message: "Offer accepted successfully.",
          offer: updatedOffer
        });
      }

      if (status === "countered") {
        const price = Number(counterPrice);

        if (!Number.isFinite(price) || price <= 0) {
          return res.status(400).json({
            success: false,
            message: "A valid counter price is required."
          });
        }

        offer.counterPrice = price;
      }

      offer.status = status;
      await offer.save();

      return res.json({
        success: true,
        message:
          status === "rejected"
            ? "Offer rejected successfully."
            : "Counter offer sent successfully.",
        offer
      });
    }

    // BUYER ACTIONS
    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
        verified: true
      });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Verified buyer profile not found."
        });
      }

      if (String(offer.buyerId) !== String(buyer.id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this offer."
        });
      }

      if (offer.status !== "countered") {
        return res.status(400).json({
          success: false,
          message: "Only countered offers can be responded to by the buyer."
        });
      }

      if (status === "countered") {
        return res.status(400).json({
          success: false,
          message: "Buyer cannot send a counter from this action."
        });
      }

      if (status === "accepted") {
        const { offer: updatedOffer } = await createOrderFromOffer(
          offerId,
          true
        );

        return res.json({
          success: true,
          message: "Counter offer accepted successfully.",
          offer: updatedOffer
        });
      }

      offer.status = "rejected";
      await offer.save();

      return res.json({
        success: true,
        message: "Counter offer rejected successfully.",
        offer
      });
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to update offers."
    });
  } catch (error) {
    console.error("Update offer status error:", error);

    if (error.message === "LOT_NOT_AVAILABLE") {
      return res.status(409).json({
        success: false,
        message: "This lot is no longer available."
      });
    }

    if (error.message === "OFFER_ALREADY_PROCESSED") {
      return res.status(409).json({
        success: false,
        message: "This offer has already been processed."
      });
    }

    if (error.message === "ORDER_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "An order already exists for this offer."
      });
    }

    if (error.message === "INVALID_COUNTER_PRICE") {
      return res.status(400).json({
        success: false,
        message: "Invalid counter offer price."
      });
    }

    if (error.message === "OFFER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Offer not found."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update offer."
    });
  }
});

export default router;
