import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    loanId: {
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
    },

    loanType: {
      type: String,
      enum: [
        "Personal Loan",
        "Education Loan",
        "Vehicle Loan",
        "Home Loan",
        "Emergency Loan",
      ],
      required: true,
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 1000,
    },

    eligibleLimit: {
      type: Number,
      required: true,
      min: 0,
    },

    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },

    creditScore: {
      type: Number,
      required: true,
      min: 0,
    },

    existingLoanAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    interestRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },

    monthlyPayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // LOAN STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "DOCUMENTS_REQUIRED",
        "APPROVED",
        "REJECTED",
        "DISBURSED",
        "ACTIVE",
        "REPAYMENT",
        "OVERDUE",
        "CLOSED",
      ],
      default: "PENDING",
      index: true,
    },

    purpose: {
      type: String,
      trim: true,
      default: "",
    },

    // ======================================================
    // ADMIN REVIEW
    // ======================================================

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminComment: {
      type: String,
      trim: true,
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // DISBURSEMENT
    // ======================================================

    disbursedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    disbursedDate: {
      type: Date,
      default: null,
    },

    // ======================================================
    // REPAYMENT INFORMATION
    // ======================================================

    repaymentStartDate: {
      type: Date,
      default: null,
    },

    totalRepaymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    nextDueDate: {
      type: Date,
      default: null,
    },

    lastPaymentDate: {
      type: Date,
      default: null,
    },

    overdueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    appliedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// GENERATE LOAN ID
// ======================================================

loanSchema.statics.generateLoanId = async function () {
  let loanId;
  let exists = true;

  while (exists) {
    loanId = `L${Date.now()}${Math.floor(
      100 + Math.random() * 900
    )}`;

    exists = await this.exists({
      loanId,
    });
  }

  return loanId;
};

// ======================================================
// ELIGIBILITY
// ======================================================

loanSchema.statics.calculateEligibleLimit = function ({
  monthlyIncome,
  creditScore,
  existingLoanAmount,
}) {
  if (monthlyIncome < 25000) {
    return 0;
  }

  if (creditScore < 650) {
    return 0;
  }

  const baseLimit = monthlyIncome * 12;

  const adjustedLimit = Math.max(
    0,
    baseLimit - Number(existingLoanAmount || 0)
  );

  return Math.min(
    adjustedLimit,
    5000000
  );
};

// ======================================================
// EMI CALCULATION
// ======================================================

loanSchema.statics.calculateEMI = function (
  principal,
  annualRate,
  tenureMonths
) {
  const monthlyRate =
    annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Math.round(
      principal / tenureMonths
    );
  }

  const emi =
    (principal *
      monthlyRate *
      Math.pow(
        1 + monthlyRate,
        tenureMonths
      )) /
    (Math.pow(
      1 + monthlyRate,
      tenureMonths
    ) - 1);

  return Math.round(emi);
};

export default mongoose.model(
  "Loan",
  loanSchema
);