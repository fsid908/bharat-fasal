
import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    orderId: {
      type: String,
      required: true,
      index: true,
    },

    buyerId: {
      type: String,
      required: true,
      index: true,
    },

    questionType: {
      type: String,
      required: true,
      trim: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Grievance", grievanceSchema);
