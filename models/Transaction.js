import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "Income",
        "Expense",
        "Transfer",
        "Deposit",
        "Withdrawal",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      default: "General",
    },

    description: {
      type: String,
      default: "",
    },

    receiverName: {
      type: String,
      default: "",
    },

    receiverAccount: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Completed",
        "Pending",
        "Failed",
      ],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);

export default Transaction;