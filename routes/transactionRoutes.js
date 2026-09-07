import express from "express";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL TRANSACTIONS
router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    })
      .populate("account", "accountNumber accountType")
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
});

// GET SINGLE TRANSACTION
router.get("/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(transaction);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transaction",
      error: error.message,
    });
  }
});

// CREATE TRANSACTION
router.post("/", protect, async (req, res) => {
  try {
    const {
      account,
      type,
      amount,
      category,
      description,
      receiverName,
      receiverAccount,
    } = req.body;

    const userAccount = await Account.findOne({
      _id: account,
      user: req.user._id,
    });

    if (!userAccount) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    if (
      ["Expense", "Withdrawal", "Transfer"].includes(type) &&
      userAccount.balance < amount
    ) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Update balance
    if (
      ["Income", "Deposit"].includes(type)
    ) {
      userAccount.balance += Number(amount);
    } else {
      userAccount.balance -= Number(amount);
    }

    await userAccount.save();

    const transaction = await Transaction.create({
      user: req.user._id,
      account,
      type,
      amount,
      category,
      description,
      receiverName,
      receiverAccount,
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
      currentBalance: userAccount.balance,
    });

  } catch (error) {
    res.status(500).json({
      message: "Transaction failed",
      error: error.message,
    });
  }
});

export default router;