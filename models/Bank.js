import mongoose from "mongoose";

const bankSchema = new mongoose.Schema(
  {
    bankId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    ifscPrefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bank", bankSchema);