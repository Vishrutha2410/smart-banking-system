import express from "express";
import mongoose from "mongoose";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";
import { evaluateTransactionForFraud } from "../services/fraudService.js";

const router = express.Router();

router.use(protect);

const ALLOWED_TYPES = ["Savings", "Current", "Salary"];

// @route  GET /api/accounts
router.get("/", async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ accounts });
  } catch (error) {
    next(error);
  }
});

// @route  GET /api/accounts/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ account });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/accounts
router.post("/", async (req, res, next) => {
  try {
    const { accountType } = req.body;

    if (!accountType || !ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({ message: `accountType must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }

    const accountNumber = await Account.generateAccountNumber();

    const account = await Account.create({
      user: req.user._id,
      accountNumber,
      accountType,
      balance: 0,
      status: "active",
    });

    await notify(
      req.user._id,
      "Account Created",
      `A new ${accountType} account (•••• ${accountNumber.slice(-4)}) has been created.`,
      "account"
    );

    res.status(201).json({ account });
  } catch (error) {
    next(error);
  }
});

// @route  PUT /api/accounts/:id/status
router.put("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }

    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.status = status;
    await account.save();

    await notify(
      req.user._id,
      "Account Status Changed",
      `Account •••• ${account.accountNumber.slice(-4)} is now ${status}.`,
      "account"
    );

    res.status(200).json({ account });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/accounts/:id/credit
// body: { amount, description }
router.post("/:id/credit", async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    // Verify account ownership
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found or not owned by you" });
    }
    if (account.status !== "active") {
      return res.status(400).json({ message: "Cannot credit an inactive account" });
    }

    // Increase balance and save
    account.balance += numericAmount;
    await account.save();

    // Create credit/income transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      account: account._id,
      type: "income",
      category: "Credit",
      amount: numericAmount,
      description: description || "Money credited",
      status: "completed",
      referenceNumber: Transaction.generateReference(),
    });

    // Create notification
    await notify(
      req.user._id,
      "Money Credited",
      `₹${numericAmount.toLocaleString("en-IN")} was credited to account •••• ${account.accountNumber.slice(
        -4
      )}. New balance: ₹${account.balance.toLocaleString("en-IN")}.`,
      "transfer"
    );

    // Fraud check runs after the write completes; failures here must never break the credit itself
    evaluateTransactionForFraud({ userId: req.user._id, transaction }).catch((err) =>
      console.error("[Fraud] evaluation failed:", err.message)
    );

    res.status(200).json({ account, transaction });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/accounts/:id/debit
// body: { amount, description }
router.post("/:id/debit", async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id" });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    // Verify account ownership
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found or not owned by you" });
    }
    if (account.status !== "active") {
      return res.status(400).json({ message: "Cannot debit an inactive account" });
    }

    // Re-fetch immediately before mutating to reduce (not eliminate) race windows
    // without MongoDB transactions, since standalone MongoDB doesn't support them.
    const fresh = await Account.findById(account._id);
    if (fresh.balance < numericAmount) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    // Decrease balance and save - never allow negative balance
    fresh.balance -= numericAmount;
    await fresh.save();

    // Create debit/expense transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      account: fresh._id,
      type: "expense",
      category: "Debit",
      amount: numericAmount,
      description: description || "Money debited",
      status: "completed",
      referenceNumber: Transaction.generateReference(),
    });

    // Create notification
    await notify(
      req.user._id,
      "Money Debited",
      `₹${numericAmount.toLocaleString("en-IN")} was debited from account •••• ${fresh.accountNumber.slice(
        -4
      )}. New balance: ₹${fresh.balance.toLocaleString("en-IN")}.`,
      "transfer"
    );

    evaluateTransactionForFraud({ userId: req.user._id, transaction }).catch((err) =>
      console.error("[Fraud] evaluation failed:", err.message)
    );

    res.status(200).json({ account: fresh, transaction });
  } catch (error) {
    next(error);
  }
});

export default router;