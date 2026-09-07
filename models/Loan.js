import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    loanType: {
      type: String,
      enum: [
        "Personal",
        "Education",
        "Home",
        "Vehicle",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    interestRate: {
      type: Number,
      required: true,
      min: 0,
    },

    // Number of months
    tenure: {
      type: Number,
      required: true,
      min: 1,
    },

    monthlyEMI: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model(
  "Loan",
  loanSchema
);

export default Loan;