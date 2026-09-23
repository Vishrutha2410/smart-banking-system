import mongoose from "mongoose";

const loanHistorySchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    oldStatus: {
      type: String,
      default: "",
    },

    newStatus: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoanHistory", loanHistorySchema);