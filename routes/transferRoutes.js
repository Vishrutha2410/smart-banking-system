import express from "express";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const {
      accountId,
      receiverName,
      receiverAccount,
      amount,
      description,
    } = req.body;

    if (
      !accountId ||
      !receiverName ||
      !receiverAccount ||
      !amount
    ) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    const transferAmount = Number(amount);

    if (transferAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    const senderAccount = await Account.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!senderAccount) {
      return res.status(404).json({
        message: "Sender account not found",
      });
    }

    if (senderAccount.status !== "Active") {
      return res.status(400).json({
        message: "Account is not active",
      });
    }

    if (senderAccount.balance < transferAmount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    senderAccount.balance -= transferAmount;

    await senderAccount.save();

    const transaction = await Transaction.create({
      user: req.user._id,
      account: senderAccount._id,
      type: "Transfer",
      amount: transferAmount,
      category: "Transfer",
      description,
      receiverName,
      receiverAccount,
      status: "Completed",
    });

    res.status(201).json({
      message: "Transfer successful",
      transaction,
      remainingBalance: senderAccount.balance,
    });

  } catch (error) {
    res.status(500).json({
      message: "Transfer failed",
      error: error.message,
    });
  }
});

export default router;