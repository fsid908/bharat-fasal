import express from "express";
import Buyer from "../models/buyer.model.js";

const router = express.Router();

// GET all buyers
router.get("/", async (req, res) => {
  try {
    const buyers = await Buyer.find().sort({ id: 1 });

    res.json({
      success: true,
      buyers,
    });
  } catch (error) {
    console.error("Get buyers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch buyers",
      error: error.message,
    });
  }
});

export default router;