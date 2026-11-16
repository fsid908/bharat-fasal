
import express from "express";
import Grievance from "../models/grievance.model.js";
import Order from "../models/order.model.js";
import Buyer from "../models/buyer.model.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/grievances
router.post("/", protect, async (req, res) => {
  try {
    const { orderId, questionType, questionText } = req.body;

    if (!orderId || !questionType || !questionText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Order, question type and question text are required.",
      });
    }

    if (questionText.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Question cannot exceed 2000 characters.",
      });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can submit questions here.",
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer profile not found.",
      });
    }

    const order = await Order.findOne({
      orderId: String(orderId),
      buyerId: String(buyer.id),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this buyer.",
      });
    }

    const grievance = await Grievance.create({
      grievanceId: `BF-GRV-${Date.now()}`,
      orderId: order.orderId,
      buyerId: String(buyer.id),
      questionType: String(questionType).trim(),
      questionText: questionText.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Question submitted successfully.",
      grievance,
    });
  } catch (error) {
    console.error("Submit grievance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit question.",
    });
  }
});


 // GET /api/grievances/my
router.get("/my", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can view their questions.",
      });
    }

    const buyer = await Buyer.findOne({
      userId: req.user.userId,
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer profile not found.",
      });
    }

    const grievances = await Grievance.find({
      buyerId: String(buyer.id),
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      grievances,
    });
  } catch (error) {
    console.error("Fetch grievances error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch questions.",
    });
  }
});

export default router;
