import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import Buyer from "../models/buyer.model.js";
import mongoose from "mongoose";
import Counter from "../models/counter.model.js";
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
  const session = await mongoose.startSession();

  try {
    let approvedBuyer;

    await session.withTransaction(async () => {
      const { type } = req.body;

      if (!["processor", "trader", "institutional"].includes(type)) {
        throw Object.assign(new Error("Invalid buyer type"), {
          statusCode: 400,
        });
      }

      const verification = await Verification.findById(req.params.id).session(
        session
      );

      if (!verification) {
        throw Object.assign(new Error("Verification not found"), {
          statusCode: 404,
        });
      }

      if (verification.type !== "buyer") {
        throw Object.assign(
          new Error("This verification is not for a buyer"),
          { statusCode: 400 }
        );
      }

      if (!["pending", "under_review"].includes(verification.status)) {
        throw Object.assign(
          new Error("Only pending or under-review verifications can be approved"),
          { statusCode: 400 }
        );
      }

      const user = await User.findById(verification.userId).session(session);

      if (!user || user.role !== "buyer") {
        throw Object.assign(new Error("Valid buyer account not found"), {
          statusCode: 404,
        });
      }

      const existingBuyer = await Buyer.findOne({
        userId: user._id,
      }).session(session);

      if (existingBuyer) {
        throw Object.assign(
          new Error("Buyer profile already exists for this user"),
          { statusCode: 409 }
        );
      }

      const lastBuyer = await Buyer.findOne()
  .sort({ id: -1 })
  .select("id")
  .session(session);

const highestBuyerId = lastBuyer?.id ?? 0;

const counter = await Counter.findOneAndUpdate(
  { _id: "buyer" },
  [
    {
      $set: {
        sequence: {
          $add: [
            {
              $max: [
                { $ifNull: ["$sequence", 0] },
                highestBuyerId,
              ],
            },
            1,
          ],
        },
      },
    },
  ],
  {
    new: true,
    upsert: true,
    session,
  }
);

const nextBuyerId = counter.sequence;

      const [buyer] = await Buyer.create(
        [
          {
            userId: user._id,
            verificationId: verification._id,
            id: nextBuyerId,
            name: user.organizationName || user.name,
            businessType: user.businessType,
            type,
            rating: 0,
            verified: true,
            location: user.village || user.district || user.state || "Not provided",
            distance: 0,
            commodities: [],
            totalTransactions: 0,
            avgPaymentDays: 0,
          },
        ],
        { session }
      );

      verification.status = "approved";
      verification.rejectionReason = "";
      verification.reviewedAt = new Date();

      await verification.save({ session });

      approvedBuyer = buyer;
    });

    return res.status(200).json({
      success: true,
      message: "Buyer verification approved successfully",
      buyer: approvedBuyer,
    });
  } catch (error) {
    console.error("Approve verification error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Buyer profile already exists or ID conflict occurred",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to approve buyer verification",
    });
  } finally {
    await session.endSession();
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
