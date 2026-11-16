import express from "express";

import Order from "../models/order.model.js";
import Offer from "../models/offer.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";
import Lot from "../models/lot.model.js";

const router = express.Router();

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isPaymentReleased = (order) =>
  ["paid", "released"].includes(normalize(order.paymentStatus));

const hasRejectedVerification = (order) =>
  normalize(order.qualityStatus) === "rejected" ||
  normalize(order.quantityStatus) === "rejected";

const canReleasePayment = (order) =>
  normalize(order.logisticsStatus) === "delivered" &&
  normalize(order.qualityStatus) === "approved" &&
  normalize(order.quantityStatus) === "approved";

// POST /api/orders/from-offer/:offerId
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

    if (normalize(offer.status) !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Order can only be created from an accepted offer.",
      });
    }

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({ userId: req.user.userId });

      if (!buyer || String(offer.buyerId) !== String(buyer.id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create this order.",
        });
      }
    } else if (["farmer", "fpo"].includes(req.user.role)) {
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

    const existingOrder = await Order.findOne({ offerId });

    if (existingOrder) {
      return res.json({
        success: true,
        message: "Order already exists for this offer.",
        order: existingOrder,
      });
    }

    const lot = await Lot.findOne({ id: offer.lotId });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found for this offer.",
      });
    }

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
      location: lot.pickupLocation || lot.sellerLocation || "",
      transport: lot.transportation || "",
      transportCost: 0,
      pricePerQuintal: Number(offer.offeredPrice),
      totalAmount: Number(offer.totalAmount),
      status: "created",
      paymentStatus: "pending",
      logisticsStatus: "pending",
      qualityStatus: "pending",
      quantityStatus: "pending",
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

// GET /api/orders/my
router.get("/my", protect, async (req, res) => {
  try {
    let orders = [];

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({ userId: req.user.userId });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Buyer profile not found.",
        });
      }

      orders = await Order.find({
        buyerId: String(buyer.id),
      }).sort({ createdAt: -1 });
    } else if (["farmer", "fpo"].includes(req.user.role)) {
      orders = await Order.find({
        sellerId: String(req.user.userId),
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view orders.",
      });
    }

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderData = order.toObject();
        const lot = await Lot.findOne({ id: order.lotId }).lean();

        return {
          ...orderData,
          sellerName: order.sellerName || lot?.sellerName || "",
          quantity: order.quantity ?? lot?.quantity ?? null,
          location:
            order.location || lot?.pickupLocation || lot?.sellerLocation || "",
          transport: order.transport || lot?.transportation || "",
          grade: order.grade || lot?.grade || "",
        };
      }),
    );

    return res.json({
      success: true,
      count: enrichedOrders.length,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});

// PATCH /api/orders/:orderId/status
router.patch("/:orderId/status", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "payment_pending",
      "paid",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    let isBuyer = false;

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({ userId: req.user.userId });
      isBuyer = Boolean(buyer && String(order.buyerId) === String(buyer.id));
    }

    const isSeller =
      ["farmer", "fpo"].includes(req.user.role) &&
      String(order.sellerId) === String(req.user.userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order.",
      });
    }

    const buyerTransitions = {
      created: ["payment_pending", "cancelled"],
      payment_pending: ["paid", "cancelled"],
      delivered: ["completed"],
    };

    const sellerTransitions = {
      created: ["cancelled"],
      payment_pending: ["cancelled"],
      paid: ["cancelled"],
      processing: ["cancelled"],
      in_transit: ["cancelled"],
      delivered: [],
    };

    const transitions = isBuyer ? buyerTransitions : sellerTransitions;

    if (!transitions[normalize(order.status)]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot move from ${order.status} to ${status}.`,
      });
    }

    if (status === "paid") {
      if (hasRejectedVerification(order)) {
        return res.status(400).json({
          success: false,
          message: "Payment is blocked because verification was rejected.",
        });
      }

      if (!canReleasePayment(order)) {
        return res.status(400).json({
          success: false,
          message:
            "Payment cannot be released until delivery, quality and quantity are approved.",
        });
      }
    }

    order.status = status;

    if (status === "payment_pending") {
      order.paymentStatus = "pending";
    }

    if (status === "paid") {
      order.paymentStatus = "paid";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
});

// GET /api/orders/:orderId
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

    let isBuyer = false;

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({ userId: req.user.userId });
      isBuyer = Boolean(buyer && String(order.buyerId) === String(buyer.id));
    }

    const isSeller =
      ["farmer", "fpo"].includes(req.user.role) &&
      String(order.sellerId) === String(req.user.userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
});

// PATCH /api/orders/:orderId/verification
router.patch("/:orderId/verification", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can verify procurement orders.",
      });
    }

    const buyer = await Buyer.findOne({ userId: req.user.userId });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer profile not found.",
      });
    }

    const { field, status } = req.body;

    if (
      !["qualityStatus", "quantityStatus"].includes(field) ||
      !["approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification field or status.",
      });
    }

    const order = await Order.findOne({
      orderId: req.params.orderId,
      buyerId: String(buyer.id),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (normalize(order.logisticsStatus) !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Verification is allowed only after delivery.",
      });
    }

    // A released payment must never be silently reverted.
    if (isPaymentReleased(order) && status === "rejected") {
      return res.status(409).json({
        success: false,
        message:
          "This order is already marked as paid/released. Admin review is required before changing verification.",
        requiresReview: true,
        order,
      });
    }

    order[field] = status;

    const qualityRejected = normalize(order.qualityStatus) === "rejected";
    const quantityRejected = normalize(order.quantityStatus) === "rejected";
    const requiresReview = qualityRejected || quantityRejected;

    if (requiresReview) {
      order.paymentStatus = "pending";
    }

    let message = "Verification status updated.";

    if (qualityRejected && quantityRejected) {
      message =
        "Both quality and quantity are rejected. Order requires review.";
    } else if (qualityRejected) {
      message =
        "Quality rejected. Order requires review before payment release.";
    } else if (quantityRejected) {
      message =
        "Quantity rejected. Order requires review before payment release.";
    }

    await order.save();

    return res.json({
      success: true,
      message,
      requiresReview,
      order,
    });
  } catch (error) {
    console.error("Order verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update order verification.",
    });
  }
});

export default router;
