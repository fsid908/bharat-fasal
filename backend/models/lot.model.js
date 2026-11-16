import mongoose from "mongoose";

const lotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    commodityId: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    grade: {
      type: String,
      required: true,
    },

    expectedPrice: {
      type: Number,
      required: true,
    },

    pickupLocation: {
      type: String,
      required: true,
    },

    availableDate: {
      type: String,
      required: true,
    },

    transportation: {
      type: String,
      required: true,
    },

    status: {
  type: String,
  enum: ["listed", "sold"],
  default: "listed",
},

    createdAt: {
      type: Date,
      default: Date.now,
    },

    sellerId: String,
    sellerName: String,
    sellerRole: String,
    sellerLocation: String,
    sellerDistrict: String,
    sellerState: String,

    offers: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Lot", lotSchema);
