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

    /*
     * Financial direction
     *
     * income   = money received
     * expense  = money spent
     * transfer = money moved between accounts
     */
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },

    /*
     * Business purpose of the transaction.
     *
     * EXPENSE
     *   Actual spending that affects Budget.
     *
     * TRANSFER
     *   Money movement that does NOT affect Budget.
     *
     * INCOME
     *   Money received that does NOT affect Budget.
     *
     * This is nullable for old transactions.
     */
    transactionKind: {
      type: String,
      enum: ["INCOME", "EXPENSE", "TRANSFER", null],
      default: null,
      index: true,
    },

    /*
     * Expense category or transfer category.
     *
     * Examples:
     *
     * Food
     * Travel
     * Shopping
     * Bills
     * Entertainment
     * Bank Transfer
     * Own Account Transfer
     */
    category: {
      type: String,
      default: "General",
      trim: true,
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
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
      ],
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
  {
    timestamps: true,
  }
);

/*
 * Generate transaction reference.
 */
transactionSchema.statics.generateReference =
  function () {
    return `TXN${Date.now()}${Math.floor(
      Math.random() * 10000
    )}`;
  };

/*
 * Generate transaction ID.
 */
transactionSchema.statics.generateTransactionId =
  function () {
    return `T${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
  };

/*
 * User transaction history index.
 */
transactionSchema.index({
  user: 1,
  date: -1,
});

/*
 * Budget/expense query index.
 */
transactionSchema.index({
  user: 1,
  transactionKind: 1,
  category: 1,
  date: -1,
});

export default mongoose.model(
  "Transaction",
  transactionSchema
);