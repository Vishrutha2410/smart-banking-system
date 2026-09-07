import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI FINANCIAL ADVISOR
router.post("/advisor", protect, async (req, res) => {
  try {
    const {
      income,
      expenses,
      savings,
    } = req.body;

    const totalIncome = Number(income || 0);
    const totalExpenses = Number(expenses || 0);
    const totalSavings = Number(savings || 0);

    let advice = "";
    let recommendation = "";

    if (totalIncome <= 0) {
      advice =
        "Please provide a valid income amount.";

      recommendation =
        "Track your monthly income before generating financial advice.";

    } else if (
      totalExpenses >
      totalIncome * 0.7
    ) {
      advice =
        "Your expenses are more than 70% of your income.";

      recommendation =
        "Reduce non-essential expenses and create a monthly budget.";

    } else if (
      totalSavings <
      totalIncome * 0.2
    ) {
      advice =
        "Your savings are below the recommended 20% of income.";

      recommendation =
        "Try setting aside at least 20% of your income every month.";

    } else {
      advice =
        "Your financial position appears healthy.";

      recommendation =
        "Continue maintaining your current savings and spending habits.";
    }

    res.json({
      title: "SmartBank AI Financial Analysis",
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalSavings,
      advice,
      recommendation,
    });

  } catch (error) {
    res.status(500).json({
      message: "Financial analysis failed",
      error: error.message,
    });
  }
});

// AI CHATBOT
router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Please enter a message",
      });
    }

    const text = message.toLowerCase();

    let reply;

    if (text.includes("balance")) {
      reply =
        "You can view your current account balance from the Accounts or Dashboard page.";

    } else if (
      text.includes("transfer")
    ) {
      reply =
        "You can transfer money securely using the Fund Transfer page.";

    } else if (
      text.includes("loan")
    ) {
      reply =
        "You can view and apply for loans from the Loans section.";

    } else if (
      text.includes("fraud") ||
      text.includes("security")
    ) {
      reply =
        "Our fraud detection system can analyze transactions and identify suspicious activity.";

    } else if (
      text.includes("budget")
    ) {
      reply =
        "Use the Smart Budget Planner to create category-based monthly spending limits.";

    } else {
      reply =
        "I am SmartBank AI. I can help you with accounts, transactions, transfers, loans, budgets and fraud detection.";
    }

    res.json({
      message,
      reply,
    });

  } catch (error) {
    res.status(500).json({
      message: "Chatbot failed",
      error: error.message,
    });
  }
});

export default router;