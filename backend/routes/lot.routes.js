import express from "express";
import Lot from "../models/lot.model.js";
console.log("🔥 LOT ROUTES LOADED");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const lot = await Lot.create(req.body);

    res.status(201).json({
      success: true,
      message: "Lot created successfully",
      lot,
    });
  } catch (error) {
    console.error("Create lot error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create lot",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
    console.log("🔥 GET /api/lots HIT");
  try {
    const lots = await Lot.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      lots,
    });
  } catch (error) {
    console.error("Get lots error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch lots",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const lot = await Lot.findOne({ id: req.params.id });

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      });
    }

    res.json({
      success: true,
      lot,
    });
  } catch (error) {
    console.error("Get lot details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch lot details",
    });
  }
});
export default router;
