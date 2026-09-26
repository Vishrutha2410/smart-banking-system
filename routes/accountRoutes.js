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

const ALLOWED_NOMINEE_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Other",
];

// ======================================================
// GET ALL ACCOUNTS
// GET /api/accounts
// ======================================================

router.get("/", async (req, res, next) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      accounts,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// GET SINGLE ACCOUNT
// GET /api/accounts/:id
// ======================================================

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid account id",
      });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      account,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// CREATE ACCOUNT
// POST /api/accounts
// ======================================================

router.post("/", async (req, res, next) => {
  try {
    const {
      accountType,
      initialDeposit,
      panNumber,
      aadhaarNumber,
      nomineeName,
      nomineeRelationship,
      nomineePhone,
    } = req.body;

    // -----------------------------
    // Account type validation
    // -----------------------------

    if (!accountType || !ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({
        message: `accountType must be one of: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // -----------------------------
    // Initial deposit validation
    // -----------------------------

    const deposit =
      initialDeposit === undefined ||
      initialDeposit === null ||
      initialDeposit === ""
        ? 0
        : Number(initialDeposit);

    if (!Number.isFinite(deposit) || deposit < 0) {
      return res.status(400).json({
        message: "Initial deposit must be a valid positive number or 0",
      });
    }

    // -----------------------------
    // PAN validation
    // PAN IS OPTIONAL
    // -----------------------------

    let cleanPan = "";

    if (panNumber && String(panNumber).trim() !== "") {
      cleanPan = String(panNumber).trim().toUpperCase();

      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (!panRegex.test(cleanPan)) {
        return res.status(400).json({
          message:
            "Invalid PAN number. Please enter a valid PAN or leave it empty.",
        });
      }
    }

    // -----------------------------
    // Aadhaar validation
    // Optional
    // -----------------------------

    let cleanAadhaar = "";

    if (
      aadhaarNumber &&
      String(aadhaarNumber).trim() !== ""
    ) {
      cleanAadhaar = String(aadhaarNumber).replace(/\s/g, "");

      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({
          message:
            "Aadhaar number must contain exactly 12 digits.",
        });
      }
    }

    // -----------------------------
    // Nominee details
    // -----------------------------

    const cleanNomineeName = nomineeName
      ? String(nomineeName).trim()
      : "";

    const cleanNomineePhone = nomineePhone
      ? String(nomineePhone).trim()
      : "";

    let cleanNomineeRelationship = nomineeRelationship
      ? String(nomineeRelationship).trim()
      : "";

    if (
      cleanNomineeRelationship &&
      !ALLOWED_NOMINEE_RELATIONSHIPS.includes(
        cleanNomineeRelationship
      )
    ) {
      return res.status(400).json({
        message: "Invalid nominee relationship.",
      });
    }

    if (cleanNomineePhone) {
      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(cleanNomineePhone)) {
        return res.status(400).json({
          message:
            "Nominee phone number must contain exactly 10 digits.",
        });
      }
    }

    // -----------------------------
    // Generate account number
    // -----------------------------

    const accountNumber =
      await Account.generateAccountNumber();

    // -----------------------------
    // Generate UPI ID
    // -----------------------------

    const upiId = await Account.generateUpiId(
      req.user,
      req.user.name
    );

    // -----------------------------
    // Create account
    // -----------------------------

    const account = await Account.create({
      user: req.user._id,

      accountNumber,

      accountType,

      balance: deposit,

      currency: "INR",

      // No bank selected currently
      bank: null,

      // No IFSC selected currently
      ifsc: "",

      upiId,

      // KYC
      panNumber: cleanPan,

      aadhaarNumber: cleanAadhaar,

      // Nominee
      nomineeName: cleanNomineeName,

      nomineeRelationship: cleanNomineeRelationship,

      nomineePhone: cleanNomineePhone,

      // IMPORTANT
      status: "active",
    });

    // -----------------------------
    // If initial deposit exists,
    // create transaction
    // -----------------------------

    let transaction = null;

    if (deposit > 0) {
      transaction = await Transaction.create({
        user: req.user._id,

        account: account._id,

        type: "income",

        category: "Initial Deposit",

        amount: deposit,

        description: "Initial account deposit",

        // IMPORTANT:
        // Transaction model expects SUCCESS
        status: "SUCCESS",

        referenceNumber:
          Transaction.generateReference(),
      });
    }

    // -----------------------------
    // Notification
    // -----------------------------

    await notify(
      req.user._id,
      "Account Created",
      `A new ${accountType} account (•••• ${accountNumber.slice(
        -4
      )}) has been created successfully.`,
      "account"
    );

    // -----------------------------
    // Response
    // -----------------------------

    res.status(201).json({
      message: "Account created successfully",
      account,
      transaction,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// UPDATE ACCOUNT STATUS
// PUT /api/accounts/:id/status
// ======================================================

router.put("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "status must be 'active' or 'inactive'",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid account id",
      });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    account.status = status;

    await account.save();

    await notify(
      req.user._id,
      "Account Status Changed",
      `Account •••• ${account.accountNumber.slice(
        -4
      )} is now ${status}.`,
      "account"
    );

    res.status(200).json({
      message: "Account status updated successfully",
      account,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// CREDIT MONEY
// POST /api/accounts/:id/credit
// ======================================================

router.post("/:id/credit", async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid account id",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "amount must be a positive number",
      });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message:
          "Account not found or not owned by you",
      });
    }

    if (account.status !== "active") {
      return res.status(400).json({
        message:
          "Cannot credit an inactive account",
      });
    }

    // Increase balance
    account.balance += numericAmount;

    await account.save();

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,

      account: account._id,

      type: "income",

      category: "Credit",

      amount: numericAmount,

      description: description || "Money credited",

      // IMPORTANT
      status: "SUCCESS",

      referenceNumber:
        Transaction.generateReference(),
    });

    // Notification
    await notify(
      req.user._id,
      "Money Credited",
      `₹${numericAmount.toLocaleString(
        "en-IN"
      )} was credited to account •••• ${account.accountNumber.slice(
        -4
      )}. New balance: ₹${account.balance.toLocaleString(
        "en-IN"
      )}.`,
      "transfer"
    );

    // Fraud check
    evaluateTransactionForFraud({
      userId: req.user._id,
      transaction,
    }).catch((err) =>
      console.error(
        "[Fraud] evaluation failed:",
        err.message
      )
    );

    res.status(200).json({
      message: "Money credited successfully",
      account,
      transaction,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// DEBIT MONEY
// POST /api/accounts/:id/debit
// ======================================================

router.post("/:id/debit", async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid account id",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "amount must be a positive number",
      });
    }

    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message:
          "Account not found or not owned by you",
      });
    }

    if (account.status !== "active") {
      return res.status(400).json({
        message:
          "Cannot debit an inactive account",
      });
    }

    // Re-fetch latest account balance
    const fresh = await Account.findById(
      account._id
    );

    if (!fresh) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (fresh.balance < numericAmount) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // Decrease balance
    fresh.balance -= numericAmount;

    await fresh.save();

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,

      account: fresh._id,

      type: "expense",

      category: "Debit",

      amount: numericAmount,

      description: description || "Money debited",

      // IMPORTANT
      status: "SUCCESS",

      referenceNumber:
        Transaction.generateReference(),
    });

    // Notification
    await notify(
      req.user._id,
      "Money Debited",
      `₹${numericAmount.toLocaleString(
        "en-IN"
      )} was debited from account •••• ${fresh.accountNumber.slice(
        -4
      )}. New balance: ₹${fresh.balance.toLocaleString(
        "en-IN"
      )}.`,
      "transfer"
    );

    // Fraud check
    evaluateTransactionForFraud({
      userId: req.user._id,
      transaction,
    }).catch((err) =>
      console.error(
        "[Fraud] evaluation failed:",
        err.message
      )
    );

    res.status(200).json({
      message: "Money debited successfully",
      account: fresh,
      transaction,
    });
  } catch (error) {
    next(error);
  }
});

export default router;