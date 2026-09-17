import express from "express";
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();
router.use(protect);

const computeSpent = async (userId, category, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const result = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category,
        type: { $in: ["expense"] },
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
};

const serializeBudget = async (budget) => {
  const spent = await computeSpent(budget.user, budget.category, budget.month, budget.year);
  const remaining = budget.monthlyLimit - spent;
  return {
    _id: budget._id,
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    month: budget.month,
    year: budget.year,
    spent,
    remaining,
    percentageUsed: Math.min(Math.round((spent / budget.monthlyLimit) * 100), 999),
    overBudget: spent > budget.monthlyLimit,
    createdAt: budget.createdAt,
  };
};

// @route GET /api/budgets
router.get("/", async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({ year: -1, month: -1 });
    const serialized = await Promise.all(budgets.map(serializeBudget));
    res.status(200).json({ budgets: serialized });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/budgets
// body: { category, monthlyLimit, month, year }
router.post("/", async (req, res, next) => {
  try {
    const { category, monthlyLimit, month, year } = req.body;
    const numericLimit = Number(monthlyLimit);
    const numericMonth = Number(month);
    const numericYear = Number(year);

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "category is required" });
    }
    if (!numericLimit || numericLimit <= 0) {
      return res.status(400).json({ message: "monthlyLimit must be greater than zero" });
    }
    if (!numericMonth || numericMonth < 1 || numericMonth > 12) {
      return res.status(400).json({ message: "month must be between 1 and 12" });
    }
    if (!numericYear || numericYear < 2000) {
      return res.status(400).json({ message: "A valid year is required" });
    }

    const existing = await Budget.findOne({
      user: req.user._id,
      category: category.trim(),
      month: numericMonth,
      year: numericYear,
    });
    if (existing) {
      return res.status(409).json({ message: "A budget for this category and month already exists" });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category: category.trim(),
      monthlyLimit: numericLimit,
      month: numericMonth,
      year: numericYear,
    });

    res.status(201).json({ budget: await serializeBudget(budget) });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/budgets/:id
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid budget id" });
    }
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { category, monthlyLimit, month, year } = req.body;
    if (category !== undefined) budget.category = category.trim();
    if (monthlyLimit !== undefined) {
      const numericLimit = Number(monthlyLimit);
      if (!numericLimit || numericLimit <= 0) {
        return res.status(400).json({ message: "monthlyLimit must be greater than zero" });
      }
      budget.monthlyLimit = numericLimit;
    }
    if (month !== undefined) budget.month = Number(month);
    if (year !== undefined) budget.year = Number(year);

    await budget.save();

    const serialized = await serializeBudget(budget);

    if (serialized.overBudget) {
      await notify(
        req.user._id,
        "Budget Exceeded",
        `You have exceeded your ${budget.category} budget for ${budget.month}/${budget.year}.`,
        "budget"
      );
    }

    res.status(200).json({ budget: serialized });
  } catch (error) {
    next(error);
  }
});

// @route DELETE /api/budgets/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid budget id" });
    }
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json({ message: "Budget deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
