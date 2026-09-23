import express from "express";
import mongoose from "mongoose";

import Loan from "../models/Loan.js";
import Account from "../models/Account.js";
import LoanHistory from "../models/LoanHistory.js";

import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();

router.use(protect);

const LOAN_TYPES = [
  "Personal Loan",
  "Education Loan",
  "Vehicle Loan",
  "Home Loan",
  "Emergency Loan",
];

const INTEREST_RATES = {
  "Personal Loan": 12,
  "Education Loan": 8,
  "Vehicle Loan": 9,
  "Home Loan": 7,
  "Emergency Loan": 13,
};

router.get("/my", async (req, res, next) => {
  try {
    const loans = await Loan.find({
      user: req.user._id,
    })
      .populate(
        "account",
        "accountNumber accountType"
      )
      .sort({ createdAt: -1 });

    res.json({ loans });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid loan ID.",
      });
    }

    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("account")
      .populate("admin", "name email");

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found.",
      });
    }

    const history =
      await LoanHistory.find({
        loan: loan._id,
      })
        .populate(
          "performedBy",
          "name email"
        )
        .sort({ createdAt: 1 });

    res.json({
      loan,
      history,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      loanType,
      accountId,
      requestedAmount,
      monthlyIncome,
      creditScore,
      existingLoanAmount,
      tenureMonths,
      purpose,
    } = req.body;

    if (!LOAN_TYPES.includes(loanType)) {
      return res.status(400).json({
        message: "Invalid loan type.",
      });
    }

    if (
      !accountId ||
      !mongoose.isValidObjectId(accountId)
    ) {
      return res.status(400).json({
        message: "Valid account is required.",
      });
    }

    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
      status: "active",
    });

    if (!account) {
      return res.status(404).json({
        message:
          "Active account not found.",
      });
    }

    const amount = Number(
      requestedAmount
    );

    const income = Number(
      monthlyIncome
    );

    const score = Number(
      creditScore
    );

    const existing = Number(
      existingLoanAmount || 0
    );

    const tenure = Number(
      tenureMonths
    );

    if (!amount || amount < 1000) {
      return res.status(400).json({
        message:
          "Requested amount must be at least ₹1,000.",
      });
    }

    if (!income || income < 0) {
      return res.status(400).json({
        message:
          "Monthly income is required.",
      });
    }

    if (!score || score < 0) {
      return res.status(400).json({
        message:
          "Credit score is required.",
      });
    }

    if (!tenure || tenure < 1) {
      return res.status(400).json({
        message:
          "Tenure must be at least one month.",
      });
    }

    const eligibleLimit =
      Loan.calculateEligibleLimit({
        monthlyIncome: income,
        creditScore: score,
        existingLoanAmount: existing,
      });

    if (eligibleLimit <= 0) {
      return res.status(400).json({
        message:
          "You do not currently meet the project eligibility rules.",
        eligibleLimit: 0,
      });
    }

    if (amount > eligibleLimit) {
      return res.status(400).json({
        message:
          `Requested amount exceeds your eligible limit of ₹${eligibleLimit.toLocaleString(
            "en-IN"
          )}.`,
        eligibleLimit,
      });
    }

    const loanId =
      await Loan.generateLoanId();

    const interestRate =
      INTEREST_RATES[loanType] || 10;

    const monthlyPayment =
      Loan.calculateEMI(
        amount,
        interestRate,
        tenure
      );

    const loan = await Loan.create({
      loanId,

      user: req.user._id,

      account: account._id,

      loanType,

      requestedAmount: amount,

      eligibleLimit,

      monthlyIncome: income,

      creditScore: score,

      existingLoanAmount: existing,

      interestRate,

      tenureMonths: tenure,

      monthlyPayment,

      status: "PENDING",

      purpose: purpose || "",
    });

    await LoanHistory.create({
      loan: loan._id,

      action: "Loan Submitted",

      oldStatus: "",

      newStatus: "PENDING",

      performedBy: req.user._id,

      comment:
        "Loan application submitted.",
    });

    await notify(
      req.user._id,

      "Loan Submitted",

      `Your loan application ${loan.loanId} has been submitted successfully.`,

      "loan"
    );

    res.status(201).json({
      message:
        "Loan application submitted successfully.",

      loan,
    });
  } catch (error) {
    next(error);
  }
});

export default router;