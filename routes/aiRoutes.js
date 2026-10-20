import express from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Loan from "../models/Loan.js";

import { protect } from "../middleware/authMiddleware.js";
import {
  getFinancialAdvice,
  chatWithAI,
  isAIConfigured,
} from "../services/aiService.js";

const router = express.Router();

router.use(protect);

// ======================================================
// BUILD USER FINANCIAL SNAPSHOT
// ======================================================
// IMPORTANT:
// Everything is filtered using the authenticated user's ID.
// No other user's information is included.
// ======================================================

const buildUserFinancialSnapshot = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  // ----------------------------------------------------
  // USER PROFILE
  // ----------------------------------------------------

  const user = await User.findById(uid).select(
    "name email phone address customerType role createdAt"
  );

  // ----------------------------------------------------
  // ACCOUNTS
  // ----------------------------------------------------

  const accounts = await Account.find({ user: uid })
    .populate("bank", "name code")
    .lean();

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  const accountCount = accounts.length;

  const accountSummary = accounts.map((account) => ({
    accountType: account.accountType,
    accountNumber: account.accountNumber
      ? `****${String(account.accountNumber).slice(-4)}`
      : "",
    balance: Number(account.balance || 0),
    currency: account.currency || "INR",
    bankName:
      account.bank?.name ||
      account.bank?.bankName ||
      "SmartBank",
    ifsc: account.ifsc || "",
    upiId: account.upiId || "",
    status: account.status || "active",
  }));

  // ----------------------------------------------------
  // CURRENT MONTH
  // ----------------------------------------------------

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const monthTxns = await Transaction.find({
    user: uid,
    date: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  }).lean();

  const totalIncome = monthTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = monthTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalSavings = totalIncome - totalExpenses;

  // ----------------------------------------------------
  // SPENDING BY CATEGORY
  // ----------------------------------------------------

  const categoryTotals = {};

  monthTxns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const category = t.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(t.amount || 0);
    });

  const spendingByCategory = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  // ----------------------------------------------------
  // LARGEST EXPENSE
  // ----------------------------------------------------

  const largestExpense =
    spendingByCategory.length > 0
      ? spendingByCategory[0]
      : null;

  // ----------------------------------------------------
  // BUDGETS
  // ----------------------------------------------------

  const budgets = await Budget.find({
    user: uid,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).lean();

  // ----------------------------------------------------
  // LOANS
  // ----------------------------------------------------

  const loans = await Loan.find({ user: uid })
    .select(
      "loanId loanType amount interestRate tenure monthlyPayment status appliedDate disbursementDate"
    )
    .lean();

  // ----------------------------------------------------
  // RECENT TRANSACTIONS
  // ----------------------------------------------------

  const recentTransactions = await Transaction.find({
    user: uid,
  })
    .sort({ date: -1 })
    .limit(10)
    .select(
      "type category amount description date referenceNumber status transactionKind"
    )
    .lean();

  // ----------------------------------------------------
  // RETURN COMPLETE SNAPSHOT
  // ----------------------------------------------------

  return {
    // User information
    user: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      customerType: user?.customerType || "personal",
      role: user?.role || "member",
    },

    // Account information
    accountCount,
    accounts: accountSummary,
    totalBalance,

    // Monthly financial information
    totalIncome,
    totalExpenses,
    totalSavings,

    // Spending
    spendingByCategory,
    largestExpense,

    // Other financial data
    budgets,
    loans,
    recentTransactions,
  };
};

// ======================================================
// FINANCIAL ADVISOR
// ======================================================

router.post("/advisor", async (req, res, next) => {
  try {
    const snapshot = await buildUserFinancialSnapshot(
      req.user._id
    );

    const result = await getFinancialAdvice(snapshot);

    res.status(200).json({
      ...result,
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// AI CHATBOT
// ======================================================

router.post("/chat", async (req, res, next) => {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        message: "message is required",
      });
    }

    const snapshot = await buildUserFinancialSnapshot(
      req.user._id
    );

    // ==================================================
    // LOCAL FALLBACK
    // ==================================================

    if (!isAIConfigured()) {
      const q = message.toLowerCase();

      let answer = null;

      // -----------------------------------------------
      // USER INFORMATION
      // -----------------------------------------------

      if (
        q.includes("my name") ||
        q.includes("what is my name") ||
        q.includes("who am i")
      ) {
        answer = snapshot.user.name
          ? `Your name is ${snapshot.user.name}.`
          : "Your name is not available in your profile.";
      }

      // -----------------------------------------------
      // EMAIL
      // -----------------------------------------------

      else if (
        q.includes("my email") ||
        q.includes("email address") ||
        q.includes("registered email")
      ) {
        answer = snapshot.user.email
          ? `Your registered email address is ${snapshot.user.email}.`
          : "Your registered email address is not available.";
      }

      // -----------------------------------------------
      // ACCOUNT COUNT
      // -----------------------------------------------

      else if (
        q.includes("how many account") ||
        q.includes("number of account") ||
        q.includes("no of account") ||
        q.includes("accounts do i have") ||
        q.includes("account do i have")
      ) {
        answer = `You currently have ${snapshot.accountCount} account${
          snapshot.accountCount === 1 ? "" : "s"
        }.`;
      }

      // -----------------------------------------------
      // ACCOUNT DETAILS
      // -----------------------------------------------

      else if (
        q.includes("my accounts") ||
        q.includes("what accounts") ||
        q.includes("account details") ||
        q.includes("bank accounts")
      ) {
        if (snapshot.accounts.length === 0) {
          answer = "You currently don't have any bank accounts.";
        } else {
          answer = snapshot.accounts
            .map(
              (account, index) =>
                `${index + 1}. ${account.bankName} - ${
                  account.accountType
                } account, balance ₹${account.balance.toLocaleString(
                  "en-IN"
                )}, ending ${account.accountNumber.slice(-4)}`
            )
            .join("\n");
        }
      }

      // -----------------------------------------------
      // BALANCE
      // -----------------------------------------------

      else if (
        q.includes("balance") ||
        q.includes("how much money")
      ) {
        answer = `Your total balance across all accounts is ₹${snapshot.totalBalance.toLocaleString(
          "en-IN"
        )}.`;
      }

      // -----------------------------------------------
      // SPENDING
      // -----------------------------------------------

      else if (
        q.includes("spend") &&
        q.includes("month")
      ) {
        answer = `You've spent ₹${snapshot.totalExpenses.toLocaleString(
          "en-IN"
        )} this month.`;
      }

      // -----------------------------------------------
      // LARGEST EXPENSE
      // -----------------------------------------------

      else if (
        q.includes("largest expense") ||
        q.includes("biggest expense")
      ) {
        answer = snapshot.largestExpense
          ? `Your largest expense category this month is ${
              snapshot.largestExpense.category
            } at ₹${snapshot.largestExpense.total.toLocaleString(
              "en-IN"
            )}.`
          : "You don't have any recorded expenses this month yet.";
      }

      // -----------------------------------------------
      // SAVINGS
      // -----------------------------------------------

      else if (
        q.includes("save") ||
        q.includes("saving")
      ) {
        answer = `You've saved ₹${snapshot.totalSavings.toLocaleString(
          "en-IN"
        )} this month (income minus expenses).`;
      }

      // -----------------------------------------------
      // BUDGET
      // -----------------------------------------------

      else if (q.includes("budget")) {
        if (snapshot.budgets.length === 0) {
          answer =
            "You currently have no active budgets for this month.";
        } else {
          answer = snapshot.budgets
            .map(
              (budget) =>
                `${budget.category}: limit ₹${Number(
                  budget.monthlyLimit || 0
                ).toLocaleString("en-IN")}`
            )
            .join(", ");
        }
      }

      // -----------------------------------------------
      // LOANS
      // -----------------------------------------------

      else if (q.includes("loan")) {
        if (snapshot.loans.length === 0) {
          answer =
            "You don't have any loan applications on record.";
        } else {
          answer = snapshot.loans
            .map(
              (loan) =>
                `${loan.loanType}: ₹${Number(
                  loan.amount || 0
                ).toLocaleString("en-IN")} (${loan.status})`
            )
            .join(", ");
        }
      }

      // -----------------------------------------------
      // TRANSACTIONS
      // -----------------------------------------------

      else if (
        q.includes("recent transaction") ||
        q.includes("transaction history") ||
        q.includes("transactions")
      ) {
        if (snapshot.recentTransactions.length === 0) {
          answer = "You don't have any transactions yet.";
        } else {
          answer = snapshot.recentTransactions
            .slice(0, 5)
            .map(
              (transaction) =>
                `${transaction.category || "Transaction"}: ₹${Number(
                  transaction.amount || 0
                ).toLocaleString("en-IN")}`
            )
            .join(", ");
        }
      }

      return res.status(200).json({
        configured: false,
        reply:
          answer ||
          "The AI service is currently unavailable. I can still answer questions about your profile, accounts, balance, spending, savings, budgets, loans, and recent transactions.",
      });
    }

    // ==================================================
    // REAL AI
    // ==================================================

    const result = await chatWithAI(
      message,
      snapshot
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "[AI CHAT ROUTE ERROR]",
      error?.message || error
    );

    next(error);
  }
});

export default router;