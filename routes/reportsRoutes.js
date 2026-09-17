import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// @route GET /api/reports?period=monthly|yearly|custom&startDate=&endDate=&year=&month=
router.get("/", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { period = "monthly", startDate, endDate, year, month } = req.query;

    let rangeStart;
    let rangeEnd;
    const now = new Date();

    if (period === "custom" && startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else if (period === "yearly") {
      const y = Number(year) || now.getFullYear();
      rangeStart = new Date(y, 0, 1);
      rangeEnd = new Date(y + 1, 0, 1);
    } else {
      const y = Number(year) || now.getFullYear();
      const m = month ? Number(month) - 1 : now.getMonth();
      rangeStart = new Date(y, m, 1);
      rangeEnd = new Date(y, m + 1, 1);
    }

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: rangeStart, $lt: rangeEnd },
    }).sort({ date: -1 });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;

    const categoryTotals = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    res.status(200).json({
      range: { start: rangeStart, end: rangeEnd },
      totalIncome,
      totalExpenses,
      savings,
      transactionCount: transactions.length,
      categoryBreakdown: Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total,
      })),
      transactions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
