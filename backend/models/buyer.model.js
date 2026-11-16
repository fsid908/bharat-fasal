import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema(
  {
    // Actual registered user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Approved verification
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Verification",
      required: true,
      unique: true,
    },

    // Marketplace display ID
    id: {
      type: Number,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Actual business type entered during registration
    businessType: {
      type: String,
      required: true,
      trim: true,
    },

    // Marketplace category
    type: {
      type: String,
      required: true,
      enum: ["processor", "trader", "institutional"],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    verified: {
  type: Boolean,
  default: false,
},

    location: {
      type: String,
      required: true,
      trim: true,
    },

    distance: {
      type: Number,
      default: 0,
      min: 0,
    },

    commodities: {
      type: [String],
      default: [],
    },

    totalTransactions: {
      type: Number,
      default: 0,
      min: 0,
    },

    avgPaymentDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    avatar: {
      type: String,
      default: "🏢",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Buyer", buyerSchema);
