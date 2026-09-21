import mongoose from "mongoose";

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    lotId: {
      type: String,
      required: true,
      index: true,
    },

    buyerId: {
      type: String,
      required: true,
      index: true,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
    },

    sellerId: {
      type: String,
      required: true,
      index: true,
    },

    sellerName: {
      type: String,
      required: true,
      trim: true,
    },

    commodityId: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    grade: {
      type: String,
      required: true,
      trim: true,
    },

    offeredPrice: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "PurchaseRequest",
  purchaseRequestSchema,
);