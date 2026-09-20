import express from "express";
import BuyerDemand from "../models/buyerDemand.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all buyer demands
router.get("/", async (req, res) => {
  try {
    const demands = await BuyerDemand.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      demands,
    });
  } catch (error) {
    console.error("Get buyer demands error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer demands",
    });
  }
});

// POST a buyer demand
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can post demands",
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
      verified: true,
    });

    if (!buyer) {
      return res.status(403).json({
        success: false,
        message: "Buyer verification is required before posting a demand",
      });
    }

    const {
      commodityId,
      quantity,
      grade,
      priceOffered,
      deliveryLocation,
      deadline,
      transportation,
    } = req.body;

    if (
      !commodityId ||
      !quantity ||
      !grade ||
      !priceOffered ||
      !deliveryLocation ||
      !deadline ||
      !transportation
    ) {
      return res.status(400).json({
        success: false,
        message: "All demand fields are required",
      });
    }

    const demand = await BuyerDemand.create({
      buyerId: buyer.id,
      userId: req.user.userId,
      commodityId,
      quantity,
      grade,
      priceOffered: Number(priceOffered),
      deliveryLocation,
      deadline,
      transportation,
    });

    res.status(201).json({
      success: true,
      message: "Buyer demand posted successfully",
      demand,
    });
  } catch (error) {
    console.error("Create buyer demand error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create buyer demand",
    });
  }
});

export default router;
