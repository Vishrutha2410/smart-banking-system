import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

transactionSchema.statics.generateReference = function () {
  return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
