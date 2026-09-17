import express from "express";
import mongoose from "mongoose";
import Loan from "../models/Loan.js";
import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();
router.use(protect);

const LOAN_TYPES = ["Personal Loan", "Education Loan", "Home Loan", "Vehicle Loan"];

// @route GET /api/loans
router.get("/", async (req, res, next) => {
  try {
    const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ loans });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/loans/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid loan id" });
    }
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }
    res.status(200).json({ loan });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/loans  (apply for a loan)
// body: { loanType, amount, tenure, purpose }
router.post("/", async (req, res, next) => {
  try {
    const { loanType, amount, tenure, purpose } = req.body;

    if (!loanType || !LOAN_TYPES.includes(loanType)) {
      return res.status(400).json({ message: `loanType must be one of: ${LOAN_TYPES.join(", ")}` });
    }
    const numericAmount = Number(amount);
    const numericTenure = Number(tenure);
    if (!numericAmount || numericAmount < 1000) {
      return res.status(400).json({ message: "amount must be at least 1000" });
    }
    if (!numericTenure || numericTenure < 1) {
      return res.status(400).json({ message: "tenure (in months) must be at least 1" });
    }

    const interestRate = Loan.getInterestRate(loanType);
    const monthlyPayment = Loan.calculateEMI(numericAmount, interestRate, numericTenure);

    const loan = await Loan.create({
      user: req.user._id,
      loanType,
      amount: numericAmount,
      interestRate,
      tenure: numericTenure,
      monthlyPayment,
      purpose: purpose || "",
      status: "Pending",
    });

    await notify(
      req.user._id,
      "Loan Application Submitted",
      `Your ${loanType} application for ₹${numericAmount.toLocaleString("en-IN")} is pending review.`,
      "loan"
    );

    res.status(201).json({ loan });
  } catch (error) {
    next(error);
  }
});

export default router;
