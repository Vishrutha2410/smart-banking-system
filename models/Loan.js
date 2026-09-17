import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loanType: {
      type: String,
      enum: ["Personal Loan", "Education Loan", "Home Loan", "Vehicle Loan"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1000, "Loan amount must be at least 1000"],
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
    },
    tenure: {
      // in months
      type: Number,
      required: true,
      min: 1,
    },
    monthlyPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Active", "Completed"],
      default: "Pending",
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    purpose: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Standard reducing-balance EMI formula
loanSchema.statics.calculateEMI = function (principal, annualRatePercent, tenureMonths) {
  const monthlyRate = annualRatePercent / 12 / 100;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
};

const INTEREST_RATES = {
  "Personal Loan": 12,
  "Education Loan": 8,
  "Home Loan": 7,
  "Vehicle Loan": 9,
};

loanSchema.statics.getInterestRate = function (loanType) {
  return INTEREST_RATES[loanType] ?? 10;
};

export default mongoose.model("Loan", loanSchema);
