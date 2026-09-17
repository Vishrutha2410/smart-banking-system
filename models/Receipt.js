import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imagePath: {
      type: String,
      default: "",
    },
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    extractedText: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["manual", "ocr"],
      default: "manual",
    },
  },
  { timestamps: true }
);

receiptSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Receipt", receiptSchema);
