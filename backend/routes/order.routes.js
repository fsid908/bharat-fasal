import express from "express";

import Order from "../models/order.model.js";
import Offer from "../models/offer.model.js";

import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   CREATE ORDER FROM ACCEPTED OFFER
   POST /api/orders/from-offer/:offerId
   Buyer / Farmer / FPO
========================================================= */

router.post("/from-offer/:offerId", protect, async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    if (offer.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Order can only be created from an accepted offer.",
      });
    }

    /* -----------------------------------------------------
       AUTHORIZATION
    ----------------------------------------------------- */

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      if (!buyer || String(offer.buyerId) !== String(buyer.id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create this order.",
        });
      }
    } else if (
      req.user.role === "farmer" ||
      req.user.role === "fpo"
    ) {
      if (String(offer.sellerId) !== String(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create this order.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create orders.",
      });
    }

    /* -----------------------------------------------------
       CHECK EXISTING ORDER
    ----------------------------------------------------- */

    const existingOrder = await Order.findOne({ offerId });

    if (existingOrder) {
      return res.json({
        success: true,
        message: "Order already exists for this offer.",
        order: existingOrder,
      });
    }

    /* -----------------------------------------------------
       CREATE ORDER
    ----------------------------------------------------- */

    const order = await Order.create({
      orderId: `BF-ORDER-${Date.now()}`,

      offerId: offer.offerId,
      lotId: offer.lotId,

      buyerId: offer.buyerId,
      buyerName: offer.buyerName,

      sellerId: offer.sellerId,
      sellerName: offer.sellerName,

      commodityId: offer.commodityId,

      quantity: Number(offer.quantity),

      pricePerQuintal: Number(offer.offeredPrice),

      totalAmount: Number(offer.totalAmount),

      status: "created",
      paymentStatus: "pending",
      logisticsStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
});

/* =========================================================
   GET MY ORDERS
   GET /api/orders/my

   Buyer -> orders where buyer belongs to logged-in user
   Farmer/FPO -> orders for seller
========================================================= */

router.get("/my", protect, async (req, res) => {
  try {
    let orders = [];

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

      orders = await Order.find({
        buyerId: String(buyer.id),
      }).sort({ createdAt: -1 });
    } else if (
      req.user.role === "farmer" ||
      req.user.role === "fpo"
    ) {
      orders = await Order.find({
        sellerId: String(req.user.userId),
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view orders.",
      });
    }

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});

/* =========================================================
   GET ORDER BY ID
   GET /api/orders/:orderId
========================================================= */

router.get("/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isBuyer =
      req.user.role === "buyer" &&
      String(order.buyerId) === String(
        (
          await Buyer.findOne({
            userId: req.user.userId,
          })
        )?.id,
      );

    const isSeller =
      (req.user.role === "farmer" || req.user.role === "fpo") &&
      String(order.sellerId) === String(req.user.userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
});

export default router;