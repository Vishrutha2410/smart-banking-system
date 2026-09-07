import express from "express";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Generate demo account number
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = String(
      Math.floor(
        100000000000 +
        Math.random() * 900000000000
      )
    );

    const account = await Account.findOne({
      accountNumber,
    });

    exists = !!account;
  }

  return accountNumber;
};

// GET ALL USER ACCOUNTS
router.get("/", protect, async (req, res) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(accounts);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
});

// GET SINGLE ACCOUNT
router.get("/:id", protect, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json(account);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch account",
      error: error.message,
    });
  }
});

// CREATE ACCOUNT
router.post("/", protect, async (req, res) => {
  try {
    const {
      accountType,
      balance,
      currency,
    } = req.body;

    const accountNumber =
      await generateAccountNumber();

    const account = await Account.create({
      user: req.user._id,
      accountNumber,
      accountType: accountType || "Savings",
      balance: balance || 0,
      currency: currency || "INR",
    });

    res.status(201).json({
      message: "Account created successfully",
      account,
    });

  } catch (error) {
    res.status(500).json({
      message: "Account creation failed",
      error: error.message,
    });
  }
});

// UPDATE ACCOUNT STATUS
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      { status },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({
      message: "Account updated successfully",
      account,
    });

  } catch (error) {
    res.status(500).json({
      message: "Account update failed",
      error: error.message,
    });
  }
});

export default router;