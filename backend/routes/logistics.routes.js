import express from "express";

import Logistics from "../models/logistics.model.js";
import Order from "../models/order.model.js";
import Buyer from "../models/buyer.model.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

/* CREATE LOGISTICS FOR ORDER */
router.post("/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const {
      pickupLocation,
      deliveryLocation,
      transporterName,
      transporterPhone,
      scheduledDate,
      expectedDelivery,
      estimatedTransportCost,
      notes,
    } = req.body;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isSeller =
      (req.user.role === "farmer" || req.user.role === "fpo") &&
      String(order.sellerId) === String(req.user.userId);

    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can create logistics.",
      });
    }

    if (!pickupLocation || !deliveryLocation) {
      return res.status(400).json({
        success: false,
        message: "Pickup and delivery locations are required.",
      });
    }

    const existingLogistics = await Logistics.findOne({ orderId });

    if (existingLogistics) {
      return res.status(409).json({
        success: false,
        message: "Logistics already exists for this order.",
        logistics: existingLogistics,
      });
    }

    const cost =
      estimatedTransportCost === undefined ||
      estimatedTransportCost === null ||
      estimatedTransportCost === ""
        ? null
        : Number(estimatedTransportCost);

    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: "Estimated transport cost must be a valid non-negative number",
      });
    }

    const deliveryDate = expectedDelivery ? new Date(expectedDelivery) : null;

    if (deliveryDate && Number.isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Expected delivery date is invalid",
      });
    }

    const logistics = await Logistics.create({
      logisticsId: `BF-LOG-${Date.now()}`,
      orderId,
      pickupLocation,
      deliveryLocation,
      transporterName: transporterName || "",
      transporterPhone: transporterPhone || "",
      scheduledDate: scheduledDate || null,
      expectedDelivery: deliveryDate,
      estimatedTransportCost: cost,
      notes: notes || "",
      status: scheduledDate ? "scheduled" : "pending",
    });

    order.expectedDelivery = deliveryDate;

    if (cost !== null) {
      order.transportCost = cost;
    }

    order.logisticsStatus = logistics.status;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Logistics created successfully.",
      logistics,
    });
  } catch (error) {
    console.error("Create logistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create logistics.",
    });
  }
});

/* GET MY LOGISTICS */
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
      });
    } else if (req.user.role === "farmer" || req.user.role === "fpo") {
      orders = await Order.find({
        sellerId: String(req.user.userId),
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view logistics.",
      });
    }

    const orderIds = orders.map((order) => order.orderId);

    const logistics = await Logistics.find({
      orderId: { $in: orderIds },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: logistics.length,
      logistics,
    });
  } catch (error) {
    console.error("Get logistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch logistics.",
    });
  }
});

/* UPDATE EXISTING LOGISTICS DETAILS */
router.patch("/:logisticsId", protect, async (req, res) => {
  try {
    const { logisticsId } = req.params;
    const {
      pickupLocation,
      deliveryLocation,
      transporterName,
      transporterPhone,
      scheduledDate,
      expectedDelivery,
      estimatedTransportCost,
      notes,
    } = req.body;

    const logistics = await Logistics.findOne({ logisticsId });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: "Logistics not found.",
      });
    }

    const order = await Order.findOne({ orderId: logistics.orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isSeller =
      ["farmer", "fpo"].includes(req.user.role) &&
      String(order.sellerId) === String(req.user.userId);

    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can update logistics details.",
      });
    }

    if (
      typeof pickupLocation !== "string" ||
      !pickupLocation.trim() ||
      typeof deliveryLocation !== "string" ||
      !deliveryLocation.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Pickup and delivery locations are required.",
      });
    }

    const cost = Number(estimatedTransportCost);

    if (
      estimatedTransportCost === undefined ||
      estimatedTransportCost === null ||
      estimatedTransportCost === "" ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid non-negative transport cost.",
      });
    }

    const deliveryDate = new Date(expectedDelivery);

    if (!expectedDelivery || Number.isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid expected delivery date.",
      });
    }

    if (scheduledDate) {
      const scheduleDate = new Date(scheduledDate);

      if (Number.isNaN(scheduleDate.getTime()) || deliveryDate < scheduleDate) {
        return res.status(400).json({
          success: false,
          message: "Expected delivery cannot be before the scheduled date.",
        });
      }

      logistics.scheduledDate = scheduleDate;
    }

    logistics.pickupLocation = pickupLocation.trim();
    logistics.deliveryLocation = deliveryLocation.trim();
    logistics.transporterName = transporterName || "";
    logistics.transporterPhone = transporterPhone || "";
    logistics.expectedDelivery = deliveryDate;
    logistics.estimatedTransportCost = cost;
    logistics.notes = notes || "";

    await logistics.save();

    order.expectedDelivery = deliveryDate;
    order.transportCost = cost;
    order.location = pickupLocation.trim();

    await order.save();

    return res.json({
      success: true,
      message: "Logistics details updated successfully.",
      logistics,
      order,
    });
  } catch (error) {
    console.error("Update logistics details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update logistics details.",
    });
  }
});

/* UPDATE LOGISTICS STATUS */
router.patch("/:logisticsId/status", protect, async (req, res) => {
  try {
    const { logisticsId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "scheduled",
      "picked_up",
      "in_transit",
      "delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid logistics status.",
      });
    }

    const logistics = await Logistics.findOne({ logisticsId });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: "Logistics not found.",
      });
    }

    const order = await Order.findOne({
      orderId: logistics.orderId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isSeller =
      (req.user.role === "farmer" || req.user.role === "fpo") &&
      String(order.sellerId) === String(req.user.userId);

    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can update logistics status.",
      });
    }

    const validTransitions = {
      pending: ["scheduled"],
      scheduled: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["delivered"],
      delivered: [],
    };

    if (!validTransitions[logistics.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Logistics cannot move from ${logistics.status} to ${status}.`,
      });
    }

    logistics.status = status;

    await logistics.save();

    order.logisticsStatus = status;

    if (status === "picked_up") {
      order.status = "processing";
    }

    if (status === "in_transit") {
      order.status = "in_transit";
    }

    if (status === "delivered") {
      order.status = "delivered";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Logistics status updated successfully.",
      logistics,
      order,
    });
  } catch (error) {
    console.error("Update logistics status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update logistics status.",
    });
  }
});

/* GET LOGISTICS BY ORDER */
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
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      isBuyer = buyer && String(order.buyerId) === String(buyer.id);
    }

    const isSeller =
      (req.user.role === "farmer" || req.user.role === "fpo") &&
      String(order.sellerId) === String(req.user.userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this logistics.",
      });
    }

    const logistics = await Logistics.findOne({ orderId });

    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: "Logistics not found for this order.",
      });
    }

    return res.json({
      success: true,
      logistics,
    });
  } catch (error) {
    console.error("Get logistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch logistics.",
    });
  }
});

export default router;
