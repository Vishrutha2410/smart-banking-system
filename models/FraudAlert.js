import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
    type: {
      type: String,
      required: true, // e.g. "large_transaction", "rapid_transactions"
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

fraudAlertSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("FraudAlert", fraudAlertSchema);
