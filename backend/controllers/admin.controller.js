import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import Buyer from "../models/buyer.model.js";

export const getPendingVerifications = async (req, res) => {
  try {
    const verifications = await Verification.find({
      status: { $in: ["pending", "under_review"] },
    })
      .populate(
        "userId",
        "name organizationName mobile email role district state businessType",
      )
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      verifications,
    });
  } catch (error) {
    console.error("Get pending verifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch verifications",
    });
  }
};

export const getVerificationById = async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id).populate(
      "userId",
      "name organizationName mobile email role district state businessType",
    );

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification not found",
      });
    }

    return res.status(200).json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error("Get verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch verification",
    });
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { type } = req.body;

    const allowedTypes = [
      "processor",
      "trader",
      "institutional",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid buyer marketplace type is required: processor, trader, or institutional",
      });
    }

    const verification = await Verification.findById(
      req.params.id
    );

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification not found",
      });
    }

    if (verification.type !== "buyer") {
      return res.status(400).json({
        success: false,
        message: "Only buyer verification can create a buyer profile",
      });
    }

    if (verification.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Verification is already approved",
      });
    }

    const user = await User.findById(verification.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Buyer user account not found",
      });
    }

    if (user.role !== "buyer") {
      return res.status(400).json({
        success: false,
        message: "Linked user is not a buyer",
      });
    }

    // Prevent duplicate buyer profile
    const existingBuyer = await Buyer.findOne({
      userId: user._id,
    });

    if (existingBuyer) {
      return res.status(409).json({
        success: false,
        message: "Buyer profile already exists",
      });
    }

    // Generate next marketplace buyer ID
    const lastBuyer = await Buyer.findOne()
      .sort({ id: -1 })
      .select("id");

    const nextBuyerId = lastBuyer
      ? lastBuyer.id + 1
      : 1;

    const buyer = await Buyer.create({
      userId: user._id,
      verificationId: verification._id,
      id: nextBuyerId,

      name: user.organizationName || user.name,

      businessType: user.businessType,

      type,

      rating: 0,
      verified: true,

      location: [user.district, user.state]
        .filter(Boolean)
        .join(", "),

      distance: 0,
      commodities: [],
      totalTransactions: 0,
      avgPaymentDays: 0,
    });

    // Mark verification approved
    verification.status = "approved";
    verification.rejectionReason = "";
    verification.reviewedAt = new Date();

    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Buyer verification approved successfully",
      buyer,
      verification,
    });
  } catch (error) {
    console.error("Approve verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve verification",
    });
  }
};

export const rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const verification = await Verification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Verification not found",
      });
    }

    verification.status = "rejected";
    verification.rejectionReason = reason.trim();
    verification.reviewedAt = new Date();

    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Verification rejected successfully",
      verification,
    });
  } catch (error) {
    console.error("Reject verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject verification",
    });
  }
};
