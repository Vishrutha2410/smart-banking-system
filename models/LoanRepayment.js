import mongoose from "mongoose";

const loanRepaymentSchema =
  new mongoose.Schema(
    {
      loan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
        required: true,
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
      },

      installmentNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      dueDate: {
        type: Date,
        required: true,
        index: true,
      },

      amountDue: {
        type: Number,
        required: true,
        min: 0,
      },

      amountPaid: {
        type: Number,
        default: 0,
        min: 0,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "PAID",
          "OVERDUE",
        ],
        default: "PENDING",
        index: true,
      },

      transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        default: null,
      },

      paymentReference: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

loanRepaymentSchema.index(
  {
    loan: 1,
    installmentNumber: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "LoanRepayment",
  loanRepaymentSchema
);