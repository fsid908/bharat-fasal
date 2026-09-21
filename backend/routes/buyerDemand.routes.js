import express from "express";
import BuyerDemand from "../models/buyerDemand.model.js";
import Buyer from "../models/buyer.model.js";
import Lot from "../models/lot.model.js";
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

// GET matching lots for a buyer demand
router.get("/:id/matches", protect, async (req, res) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id);

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    const normalizedDemandGrade = demand.grade
  .replace(/^Grade\s+/i, "")
  .trim();

const lots = await Lot.find({
  status: "listed",
  commodityId: demand.commodityId,
}).sort({ createdAt: -1 });

const gradeMatchingLots = lots.filter((lot) => {
  const normalizedLotGrade = String(lot.grade)
    .replace(/^Grade\s+/i, "")
    .trim();

  return normalizedLotGrade.toLowerCase() === normalizedDemandGrade.toLowerCase();
});

   const matchingLots = gradeMatchingLots.filter((lot) => {
      const lotQuantity = Number(lot.quantity);
      const demandQuantity = Number(demand.quantity);
      const lotPrice = Number(lot.expectedPrice);
      const demandPrice = Number(demand.priceOffered);

      return (
        lotQuantity >= demandQuantity &&
        lotPrice <= demandPrice
      );
    });

    return res.json({
      success: true,
      demand,
      count: matchingLots.length,
      lots: matchingLots,
    });
  } catch (error) {
    console.error("Match buyer demand error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find matching lots",
    });
  }
});
export default router;
