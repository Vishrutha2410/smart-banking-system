import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
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
    status: {
      type: String,
      enum: ["completed", "failed"],
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

transferSchema.statics.generateReference = function () {
  return `TRF${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

export default mongoose.model("Transfer", transferSchema);
