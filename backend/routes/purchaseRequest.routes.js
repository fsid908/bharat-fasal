import express from "express";
import PurchaseRequest from "../models/purchaseRequest.model.js";
import Lot from "../models/lot.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

console.log("🔥 PURCHASE REQUEST ROUTES LOADED");

router.post("/", protect, async (req, res) => {
  try {
    const { lotId } = req.body;

    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: "Lot ID is required",
      });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can send purchase requests",
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer profile not found",
      });
    }

    const lot = await Lot.findOne({
      id: lotId,
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      });
    }

    if (lot.status !== "listed") {
      return res.status(400).json({
        success: false,
        message: "This lot is no longer available",
      });
    }

    const existingRequest = await PurchaseRequest.findOne({
      lotId: lot.id,
      buyerId: String(buyer.id),
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this lot",
        request: existingRequest,
      });
    }

    const quantity = Number(lot.quantity);
    const offeredPrice = Number(lot.expectedPrice);
    const totalAmount = quantity * offeredPrice;

    const requestId = `BF-REQ-${Date.now()}`;

    const purchaseRequest = await PurchaseRequest.create({
      requestId,
      lotId: lot.id,
      buyerId: String(buyer.id),
      buyerName: buyer.name,
      sellerId: String(lot.sellerId),
      sellerName: lot.sellerName || "Seller",
      commodityId: lot.commodityId,
      quantity,
      grade: lot.grade,
      offeredPrice,
      totalAmount,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Purchase request sent successfully",
      request: purchaseRequest,
    });
  } catch (error) {
    console.error("Create purchase request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase request",
      error: error.message,
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const requests = await PurchaseRequest.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get purchase requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase requests",
    });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    if (req.user.role === "farmer" || req.user.role === "fpo") {
      const requests = await PurchaseRequest.find({
        sellerId: String(req.user.userId),
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: requests.length,
        requests,
      });
    }

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: "Buyer profile not found",
        });
      }

      const requests = await PurchaseRequest.find({
        buyerId: String(buyer.id),
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: requests.length,
        requests,
      });
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to view purchase requests",
    });
  } catch (error) {
    console.error("Get my purchase requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your purchase requests",
    });
  }
});

router.get("/:requestId", protect, async (req, res) => {
  try {
    const request = await PurchaseRequest.findOne({
      requestId: req.params.requestId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Purchase request not found",
      });
    }

    return res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Get purchase request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase request",
    });
  }
});

router.patch("/:requestId/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (req.user.role !== "farmer" && req.user.role !== "fpo") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can update purchase requests",
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request status",
      });
    }

    const request = await PurchaseRequest.findOne({
      requestId: req.params.requestId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Purchase request not found",
      });
    }

    if (String(request.sellerId) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be updated",
      });
    }

    request.status = status;

    await request.save();

    return res.json({
      success: true,
      message: `Purchase request ${status} successfully`,
      request,
    });
  } catch (error) {
    console.error("Update purchase request status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update purchase request status",
    });
  }
});

export default router;
