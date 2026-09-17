import express from "express";
import mongoose from "mongoose";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Transfer from "../models/Transfer.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";
import { evaluateTransactionForFraud } from "../services/fraudService.js";

const router = express.Router();

router.use(protect);

// @route  GET /api/transfers
router.get("/", async (req, res, next) => {
  try {
    const transfers = await Transfer.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate("senderAccount", "accountNumber accountType")
      .populate("recipientAccount", "accountNumber accountType")
      .populate("sender", "name email")
      .populate("recipient", "name email");

    res.status(200).json({ transfers });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/transfers
router.post("/", async (req, res, next) => {
  const { fromAccountId, recipientAccountNumber, amount, description } = req.body;

  try {
    if (!fromAccountId || !mongoose.isValidObjectId(fromAccountId)) {
      return res.status(400).json({ message: "Valid fromAccountId is required" });
    }
    if (!recipientAccountNumber) {
      return res.status(400).json({ message: "recipientAccountNumber is required" });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    // 1. Sender account must belong to the authenticated user
    const senderAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id });
    if (!senderAccount) {
      return res.status(404).json({ message: "Sender account not found or not owned by you" });
    }
    if (senderAccount.status !== "active") {
      return res.status(400).json({ message: "Sender account is not active" });
    }

    // 2 & 3. Recipient account must exist (existing project lookup logic)
    const recipientAccount = await Account.findOne({ accountNumber: recipientAccountNumber });
    if (!recipientAccount) {
      return res.status(404).json({ message: "Recipient account not found" });
    }
    if (recipientAccount.status !== "active") {
      return res.status(400).json({ message: "Recipient account is not active" });
    }

    // Prevent transfer to same account
    if (String(senderAccount._id) === String(recipientAccount._id)) {
      return res.status(400).json({ message: "Cannot transfer to the same account" });
    }

    // 4. Sufficient balance
    if (senderAccount.balance < numericAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Re-fetch immediately before mutating to reduce (not eliminate) race windows
    // without MongoDB transactions, since standalone MongoDB doesn't support them.
    const freshSender = await Account.findById(senderAccount._id);
    const freshRecipient = await Account.findById(recipientAccount._id);

    if (freshSender.balance < numericAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 5 & 6. Deduct from sender, add to recipient
    freshSender.balance -= numericAmount;
    freshRecipient.balance += numericAmount;

    // 7. Save both accounts
    await freshSender.save();
    await freshRecipient.save();

    // 8. Create transfer record
    const referenceNumber = Transfer.generateReference();
    const transfer = await Transfer.create({
      sender: req.user._id,
      senderAccount: freshSender._id,
      recipient: freshRecipient.user,
      recipientAccount: freshRecipient._id,
      amount: numericAmount,
      description: description || "",
      status: "completed",
      referenceNumber,
    });

    // 9. Sender transaction (expense)
    const senderTransaction = await Transaction.create({
      user: req.user._id,
      account: freshSender._id,
      type: "transfer",
      category: "Transfer Out",
      amount: numericAmount,
      description: description || `Transfer to ${freshRecipient.accountNumber}`,
      status: "completed",
      referenceNumber: Transaction.generateReference(),
    });

    // 10. Recipient transaction (income)
    await Transaction.create({
      user: freshRecipient.user,
      account: freshRecipient._id,
      type: "transfer",
      category: "Transfer In",
      amount: numericAmount,
      description: description || `Transfer from ${freshSender.accountNumber}`,
      status: "completed",
      referenceNumber: Transaction.generateReference(),
    });

    // 11. Notifications
    await Notification.create([
      {
        user: req.user._id,
        title: "Transfer Sent",
        message: `You sent ${numericAmount} to account ${freshRecipient.accountNumber}.`,
        type: "transfer",
      },
      {
        user: freshRecipient.user,
        title: "Transfer Received",
        message: `You received ${numericAmount} from account ${freshSender.accountNumber}.`,
        type: "transfer",
      },
    ]);

    evaluateTransactionForFraud({
      userId: req.user._id,
      transaction: senderTransaction,
    }).catch((err) => console.error("[Fraud] evaluation failed:", err.message));

    // 12. Return the existing API response format
    res.status(201).json({
      message: "Transfer completed successfully",
      transfer,
      senderAccount: freshSender,
    });
  } catch (error) {
    next(error);
  }
});

export default router;