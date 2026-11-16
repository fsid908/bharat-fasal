import express from "express";
import PurchaseRequest from "../models/purchaseRequest.model.js";
import Lot from "../models/lot.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";
import mongoose from "mongoose";
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
      verified: true,
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Verified buyer profile not found",
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
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all purchase requests",
      });
    }

    const requests = await PurchaseRequest.find().sort({
      createdAt: -1,
    });

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

    const isAdmin = req.user.role === "admin";
    const isSeller =
      (req.user.role === "farmer" || req.user.role === "fpo") &&
      String(request.sellerId) === String(req.user.userId);

    let isBuyer = false;

    if (req.user.role === "buyer") {
      const buyer = await Buyer.findOne({
        userId: req.user.userId,
      });

      isBuyer = buyer && String(request.buyerId) === String(buyer.id);
    }

    if (!isAdmin && !isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this request",
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
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request status"
    });
  }

  if (req.user.role !== "farmer" && req.user.role !== "fpo") {
    return res.status(403).json({
      success: false,
      message: "Only sellers can update purchase requests"
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedRequest;

    await session.withTransaction(async () => {
      const request = await PurchaseRequest.findOne({
        requestId: req.params.requestId
      }).session(session);

      if (!request) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      if (String(request.sellerId) !== String(req.user.userId)) {
        throw new Error("NOT_AUTHORIZED");
      }

      if (request.status !== "pending") {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }

      if (status === "accepted") {
        const lot = await Lot.findOneAndUpdate(
          {
            id: request.lotId,
            status: "listed"
          },
          {
            $set: { status: "sold" }
          },
          {
            new: true,
            session
          }
        );

        if (!lot) {
          throw new Error("LOT_NOT_AVAILABLE");
        }
      }

      updatedRequest = await PurchaseRequest.findOneAndUpdate(
        {
          requestId: req.params.requestId,
          sellerId: String(req.user.userId),
          status: "pending"
        },
        {
          $set: { status }
        },
        {
          new: true,
          runValidators: true,
          session
        }
      );

      if (!updatedRequest) {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }
    });

    return res.json({
      success: true,
      message: `Purchase request ${status} successfully`,
      request: updatedRequest
    });
  } catch (error) {
    console.error("Update purchase request status error:", error);

    const errors = {
      REQUEST_NOT_FOUND: [404, "Purchase request not found"],
      NOT_AUTHORIZED: [403, "You are not authorized to update this request"],
      REQUEST_ALREADY_PROCESSED: [409, "This request has already been processed"],
      LOT_NOT_AVAILABLE: [409, "This lot is no longer available"]
    };

    const [code, message] = errors[error.message] || [
      500,
      "Failed to update purchase request status"
    ];

    return res.status(code).json({
      success: false,
      message
    });
  } finally {
    await session.endSession();
  }
});


export default router;
