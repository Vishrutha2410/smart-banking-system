import express from "express";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Card from "../models/Card.js";
import Loan from "../models/Loan.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// @route  GET /api/dashboard
router.get("/", async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id });
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthTransactions, cardCount, activeLoanCount, recentTransactions, spendingByCategoryAgg] =
      await Promise.all([
        Transaction.find({ user: req.user._id, date: { $gte: startOfMonth } }),
        Card.countDocuments({ user: req.user._id }),
        Loan.countDocuments({ user: req.user._id, status: { $in: ["Approved", "Active"] } }),
        Transaction.find({ user: req.user._id }).sort({ date: -1 }).limit(5),
        Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              type: { $in: ["expense"] },
              date: { $gte: startOfMonth },
            },
          },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
        ]),
      ]);

    const totalIncome = monthTransactions
      .filter((t) => t.type === "income" || (t.type === "transfer" && t.category === "Transfer In"))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTransactions
      .filter((t) => t.type === "expense" || (t.type === "transfer" && t.category === "Transfer Out"))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSavings = totalIncome - totalExpenses;

    const spendingByCategory = spendingByCategoryAgg.map((c) => ({
      category: c._id,
      total: c.total,
    }));

    res.status(200).json({
      user: req.user.toSafeObject(),
      totalBalance,
      totalIncome,
      totalExpenses,
      totalSavings,
      accountCount: accounts.length,
      cardCount,
      activeLoanCount,
      accounts,
      recentTransactions,
      spendingByCategory,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
