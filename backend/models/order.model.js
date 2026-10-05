import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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

    pricePerQuintal: {
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
      enum: [
        "created",
        "payment_pending",
        "paid",
        "processing",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "created",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    logisticsStatus: {
      type: String,
      enum: ["pending", "scheduled", "picked_up", "in_transit", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);