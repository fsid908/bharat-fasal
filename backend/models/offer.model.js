import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offerId: {
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
      enum: ["pending", "accepted", "rejected", "countered"],
      default: "pending",
      index: true,
    },

    counterPrice: {
      type: Number,
      min: 1,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Offer", offerSchema);