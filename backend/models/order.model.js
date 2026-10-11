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

    location: {
      type: String,
      trim: true,
      default: "",
    },

    transport: {
      type: String,
      trim: true,
      default: "",
    },

    transportCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    expectedDelivery: {
      type: Date,
      default: null,
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
    qualityStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    quantityStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
