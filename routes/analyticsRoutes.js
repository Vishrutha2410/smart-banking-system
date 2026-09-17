import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// @route GET /api/analytics
router.get("/", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const totalTxns = await Transaction.countDocuments({ user: userId });
    if (totalTxns === 0) {
      return res.status(200).json({
        hasData: false,
        message: "Not enough financial data to generate analytics.",
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyIncomeAgg, monthlyExpenseAgg, categoryAgg, monthlyTrendAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: "income", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense" } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const monthlyIncome = monthlyIncomeAgg[0]?.total || 0;
    const monthlyExpenses = monthlyExpenseAgg[0]?.total || 0;
    const savings = monthlyIncome - monthlyExpenses;

    const spendingByCategory = categoryAgg.map((c) => ({ category: c._id, total: c.total }));
    const topCategories = spendingByCategory.slice(0, 5);

    // Reshape monthly trend into { month: "2026-09", income, expense }
    const trendMap = {};
    monthlyTrendAgg.forEach((row) => {
      const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
      if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expense: 0 };
      if (row._id.type === "income") trendMap[key].income += row.total;
      if (row._id.type === "expense" || row._id.type === "transfer") trendMap[key].expense += row.total;
    });
    const monthlyTrends = Object.values(trendMap);

    res.status(200).json({
      hasData: true,
      monthlyIncome,
      monthlyExpenses,
      savings,
      spendingByCategory,
      topCategories,
      monthlyTrends,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
