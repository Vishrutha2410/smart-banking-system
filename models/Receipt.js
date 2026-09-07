import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    merchantName: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      default: "General",
    },

    receiptImage: {
      type: String,
      default: "",
    },

    scannedText: {
      type: String,
      default: "",
    },

    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Receipt = mongoose.model(
  "Receipt",
  receiptSchema
);

export default Receipt;