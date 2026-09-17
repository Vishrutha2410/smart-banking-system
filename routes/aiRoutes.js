import express from "express";
import mongoose from "mongoose";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Loan from "../models/Loan.js";
import { protect } from "../middleware/authMiddleware.js";
import { getFinancialAdvice, chatWithAI, isAIConfigured } from "../services/aiService.js";

const router = express.Router();
router.use(protect);

// Builds a snapshot using ONLY the authenticated user's own MongoDB data.
// Every query below is filtered by uid - never returns another user's data.
const buildUserFinancialSnapshot = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const accounts = await Account.find({ user: uid });
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTxns = await Transaction.find({ user: uid, date: { $gte: startOfMonth } });
  const totalIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  const categoryTotals = {};
  monthTxns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
  const spendingByCategory = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total,
  }));

  const budgets = await Budget.find({ user: uid, month: now.getMonth() + 1, year: now.getFullYear() });
  const loans = await Loan.find({ user: uid }).select(
    "loanType amount interestRate tenure monthlyPayment status appliedDate"
  );
  const recentTransactions = await Transaction.find({ user: uid })
    .sort({ date: -1 })
    .limit(10)
    .select("type category amount description date referenceNumber");

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalSavings,
    spendingByCategory,
    budgets,
    loans,
    recentTransactions,
  };
};

// @route POST /api/ai/advisor
router.post("/advisor", async (req, res, next) => {
  try {
    const snapshot = await buildUserFinancialSnapshot(req.user._id);
    const result = await getFinancialAdvice(snapshot);
    res.status(200).json({ ...result, snapshot });
  } catch (error) {
    next(error);
  }
});

// @route POST /api/ai/chat
// body: { message }
router.post("/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const snapshot = await buildUserFinancialSnapshot(req.user._id);

    if (!isAIConfigured()) {
      // Answer a small set of common questions locally so the chatbot is
      // still useful without an AI provider configured, and is transparent
      // about the fact this isn't AI-generated. These answers are still
      // real, computed from the user's own MongoDB data - never invented.
      const q = message.toLowerCase();
      let answer = null;

      if (q.includes("balance")) {
        answer = `Your total balance across all accounts is ₹${snapshot.totalBalance.toLocaleString("en-IN")}.`;
      } else if (q.includes("spend") && q.includes("month")) {
        answer = `You've spent ₹${snapshot.totalExpenses.toLocaleString("en-IN")} this month.`;
      } else if (q.includes("largest expense") || q.includes("biggest expense")) {
        const top = [...snapshot.spendingByCategory].sort((a, b) => b.total - a.total)[0];
        answer = top
          ? `Your largest expense category this month is ${top.category} at ₹${top.total.toLocaleString("en-IN")}.`
          : "You don't have any recorded expenses this month yet.";
      } else if (q.includes("save") || q.includes("saving")) {
        answer = `You've saved ₹${snapshot.totalSavings.toLocaleString("en-IN")} this month (income minus expenses).`;
      } else if (q.includes("budget")) {
        if (snapshot.budgets.length === 0) {
          answer = "You don't have any budgets set up for this month yet.";
        } else {
          answer = snapshot.budgets
            .map((b) => `${b.category}: limit ₹${b.monthlyLimit.toLocaleString("en-IN")}`)
            .join(", ");
        }
      } else if (q.includes("loan")) {
        if (snapshot.loans.length === 0) {
          answer = "You don't have any loan applications on record.";
        } else {
          answer = snapshot.loans
            .map((l) => `${l.loanType}: ₹${l.amount.toLocaleString("en-IN")} (${l.status})`)
            .join(", ");
        }
      } else if (q.includes("recent transaction") || q.includes("transaction history")) {
        if (snapshot.recentTransactions.length === 0) {
          answer = "You don't have any transactions yet.";
        } else {
          answer = snapshot.recentTransactions
            .slice(0, 5)
            .map((t) => `${t.category}: ₹${t.amount.toLocaleString("en-IN")}`)
            .join(", ");
        }
      }

      return res.status(200).json({
        configured: false,
        reply:
          answer ||
          "The AI Chatbot is currently unavailable because the AI service is not configured. I can still answer simple questions about your balance, spending, savings, budgets, loans, and recent transactions.",
      });
    }

    const result = await chatWithAI(message, snapshot);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;