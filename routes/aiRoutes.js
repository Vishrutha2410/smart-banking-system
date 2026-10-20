import express from "express";
import mongoose from "mongoose";

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


/* ======================================================
   BUILD USER FINANCIAL SNAPSHOT
====================================================== */

const buildUserFinancialSnapshot = async (
  userId
) => {
  const uid = new mongoose.Types.ObjectId(userId);

  /* ---------------- Accounts ---------------- */

  const accounts = await Account.find({
    user: uid,
  });

  const totalBalance = accounts.reduce(
    (sum, account) =>
      sum + Number(account.balance || 0),
    0
  );


  /* ---------------- Current Month ---------------- */

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const monthTransactions =
    await Transaction.find({
      user: uid,
      date: {
        $gte: startOfMonth,
      },
    });


  /* ---------------- Income ---------------- */

  const totalIncome =
    monthTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );


  /* ---------------- Expenses ---------------- */

  const totalExpenses =
    monthTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );


  /* ---------------- Savings ---------------- */

  const totalSavings =
    totalIncome - totalExpenses;


  /* ---------------- Category Spending ---------------- */

  const categoryTotals = {};

  monthTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .forEach((transaction) => {
      const category =
        transaction.category ||
        "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(transaction.amount || 0);
    });

  const spendingByCategory =
    Object.entries(categoryTotals).map(
      ([category, total]) => ({
        category,
        total,
      })
    );


  /* ---------------- Budgets ---------------- */

  const budgets = await Budget.find({
    user: uid,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });


  /* ---------------- Loans ---------------- */

  const loans = await Loan.find({
    user: uid,
  }).select(
    "loanType amount interestRate tenure monthlyPayment status appliedDate"
  );


  /* ---------------- Recent Transactions ---------------- */

  const recentTransactions =
    await Transaction.find({
      user: uid,
    })
      .sort({
        date: -1,
      })
      .limit(10)
      .select(
        "type category amount description date referenceNumber"
      );


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


/* ======================================================
   AI FINANCIAL ADVISOR
====================================================== */

router.post(
  "/advisor",
  async (req, res, next) => {
    try {
      const snapshot =
        await buildUserFinancialSnapshot(
          req.user._id
        );

      const result =
        await getFinancialAdvice(
          snapshot
        );

      res.status(200).json({
        ...result,
        snapshot,
      });
    } catch (error) {
      next(error);
    }
  }
);


/* ======================================================
   AI CHATBOT
====================================================== */

router.post(
  "/chat",
  async (req, res, next) => {
    try {
      const { message } = req.body;

      if (
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          message:
            "message is required",
        });
      }


      const snapshot =
        await buildUserFinancialSnapshot(
          req.user._id
        );


      /* ----------------------------------------------
         LOCAL FALLBACK
      ---------------------------------------------- */

      if (!isAIConfigured()) {
        const question =
          message.toLowerCase();

        let answer = null;


        if (
          question.includes("balance")
        ) {
          answer =
            `Your total balance across all accounts is ₹${snapshot.totalBalance.toLocaleString(
              "en-IN"
            )}.`;
        }


        else if (
          question.includes("spend") &&
          question.includes("month")
        ) {
          answer =
            `You've spent ₹${snapshot.totalExpenses.toLocaleString(
              "en-IN"
            )} this month.`;
        }


        else if (
          question.includes(
            "largest expense"
          ) ||
          question.includes(
            "biggest expense"
          )
        ) {
          const top =
            [
              ...snapshot.spendingByCategory,
            ].sort(
              (a, b) =>
                b.total - a.total
            )[0];

          answer = top
            ? `Your largest expense category this month is ${top.category} at ₹${top.total.toLocaleString(
                "en-IN"
              )}.`
            : "You don't have any recorded expenses this month yet.";
        }


        else if (
          question.includes("save") ||
          question.includes("saving")
        ) {
          answer =
            `You've saved ₹${snapshot.totalSavings.toLocaleString(
              "en-IN"
            )} this month (income minus expenses).`;
        }


        else if (
          question.includes("budget")
        ) {
          if (
            snapshot.budgets.length ===
            0
          ) {
            answer =
              "You don't have any budgets set up for this month yet.";
          } else {
            answer =
              snapshot.budgets
                .map(
                  (budget) =>
                    `${budget.category}: limit ₹${Number(
                      budget.monthlyLimit || 0
                    ).toLocaleString(
                      "en-IN"
                    )}`
                )
                .join(", ");
          }
        }


        else if (
          question.includes("loan")
        ) {
          if (
            snapshot.loans.length ===
            0
          ) {
            answer =
              "You don't have any loan applications on record.";
          } else {
            answer =
              snapshot.loans
                .map(
                  (loan) =>
                    `${loan.loanType}: ₹${Number(
                      loan.amount || 0
                    ).toLocaleString(
                      "en-IN"
                    )} (${loan.status})`
                )
                .join(", ");
          }
        }


        else if (
          question.includes(
            "recent transaction"
          ) ||
          question.includes(
            "transaction history"
          )
        ) {
          if (
            snapshot.recentTransactions
              .length === 0
          ) {
            answer =
              "You don't have any transactions yet.";
          } else {
            answer =
              snapshot.recentTransactions
                .slice(0, 5)
                .map(
                  (transaction) =>
                    `${transaction.category}: ₹${Number(
                      transaction.amount || 0
                    ).toLocaleString(
                      "en-IN"
                    )}`
                )
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


      /* ----------------------------------------------
         GROQ AI
      ---------------------------------------------- */

      const result =
        await chatWithAI(
          message,
          snapshot
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;