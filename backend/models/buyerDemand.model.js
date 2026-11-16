import mongoose from "mongoose";

const buyerDemandSchema = new mongoose.Schema(
  {
    buyerId: {
      type: Number,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    commodityId: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: String,
      required: true,
      trim: true,
    },

    grade: {
      type: String,
      required: true,
      trim: true,
    },

    priceOffered: {
      type: Number,
      required: true,
      min: 1,
    },

    deliveryLocation: {
      type: String,
      required: true,
      trim: true,
    },

    deadline: {
      type: String,
      required: true,
      trim: true,
    },

    transportation: {
      type: String,
      required: true,
      enum: ["buyer", "seller"],
    },

    status: {
      type: String,
      enum: ["active", "urgent", "closed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BuyerDemand", buyerDemandSchema);
