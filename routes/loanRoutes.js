import express from "express";
import Loan from "../models/Loan.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL LOANS
router.get("/", protect, async (req, res) => {
  try {
    const loans = await Loan.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(loans);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
});

// APPLY FOR LOAN
router.post("/", protect, async (req, res) => {
  try {
    const {
      loanType,
      amount,
      interestRate,
      tenure,
    } = req.body;

    if (
      !loanType ||
      !amount ||
      interestRate === undefined ||
      !tenure
    ) {
      return res.status(400).json({
        message: "All loan fields are required",
      });
    }

    const principal = Number(amount);
    const annualRate = Number(interestRate);
    const months = Number(tenure);

    const monthlyRate =
      annualRate / 12 / 100;

    let monthlyEMI;

    if (monthlyRate === 0) {
      monthlyEMI = principal / months;
    } else {
      monthlyEMI =
        (
          principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, months)
        ) /
        (
          Math.pow(1 + monthlyRate, months) - 1
        );
    }

    const loan = await Loan.create({
      user: req.user._id,
      loanType,
      amount: principal,
      interestRate: annualRate,
      tenure: months,
      monthlyEMI: Number(monthlyEMI.toFixed(2)),
    });

    res.status(201).json({
      message: "Loan application submitted successfully",
      loan,
    });

  } catch (error) {
    res.status(500).json({
      message: "Loan application failed",
      error: error.message,
    });
  }
});

export default router;