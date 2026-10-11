import mongoose from "mongoose";

const logisticsSchema = new mongoose.Schema(
  {
    logisticsId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryLocation: {
      type: String,
      required: true,
      trim: true,
    },

    transporterName: {
      type: String,
      trim: true,
      default: "",
    },

    transporterPhone: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "scheduled", "picked_up", "in_transit", "delivered"],
      default: "pending",
      index: true,
    },

    scheduledDate: {
      type: Date,
      default: null,
    },

    estimatedTransportCost: {
      type: Number,
      min: 0,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Logistics", logisticsSchema);
