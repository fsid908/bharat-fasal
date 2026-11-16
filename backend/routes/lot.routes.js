
import express from "express";
import Lot from "../models/lot.model.js";
import User from "../models/user.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// CREATE LOT - Verified farmer authentication
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Only farmers can create lots",
      });
    }

    const seller = await User.findById(req.user.userId);

    if (!seller || seller.role !== "farmer") {
      return res.status(404).json({
        success: false,
        message: "Farmer account not found",
      });
    }

    const {
      id,
      commodityId,
      quantity,
      grade,
      expectedPrice,
      pickupLocation,
      availableDate,
      transportation,
    } = req.body;

    const numericQuantity = Number(quantity);
    const numericPrice = Number(expectedPrice);

    if (
      !id ||
      !commodityId ||
      !grade ||
      !pickupLocation?.trim() ||
      !availableDate ||
      !transportation ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0 ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required and quantity and price must be greater than 0",
      });
    }

    const existingLot = await Lot.findOne({ id });

    if (existingLot) {
      return res.status(409).json({
        success: false,
        message: "Lot ID already exists",
      });
    }

    const lot = await Lot.create({
      id,
      commodityId,
      quantity: numericQuantity,
      grade,
      expectedPrice: numericPrice,
      pickupLocation: pickupLocation.trim(),
      availableDate,
      transportation,
      status: "listed",
      sellerId: seller._id.toString(),
      sellerName: seller.name,
      sellerRole: seller.role,
      sellerLocation: seller.village || "",
      sellerDistrict: seller.district,
      sellerState: seller.state,
    });

    return res.status(201).json({
      success: true,
      message: "Lot created successfully",
      lot,
    });
  } catch (error) {
    console.error("Create lot error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lot ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create lot",
    });
  }
});

// GET ALL LOTS
router.get("/", async (req, res) => {
  try {
    const lots = await Lot.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      lots,
    });
  } catch (error) {
    console.error("Get lots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lots",
    });
  }
});

// GET LOT BY ID
router.get("/:id", async (req, res) => {
  try {
    const lot = await Lot.findOne({ id: req.params.id });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      });
    }

    return res.json({
      success: true,
      lot,
    });
  } catch (error) {
    console.error("Get lot details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lot details",
    });
  }
});

export default router;
