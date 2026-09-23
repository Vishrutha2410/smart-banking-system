import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      index: true,
    },

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

    senderAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    receiverAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    senderBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
    },

    receiverBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
    },

    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },

    category: {
      type: String,
      default: "General",
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    transferMethod: {
      type: String,
      enum: [
        "UPI",
        "IMPS",
        "NEFT",
        "RTGS",
        "SAME_BANK",
        "OWN_ACCOUNT",
        null,
      ],
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "SUCCESS",
    },

    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

transactionSchema.statics.generateReference = function () {
  return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

transactionSchema.statics.generateTransactionId = function () {
  return `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);