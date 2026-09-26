import express from "express";
import mongoose from "mongoose";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Bank from "../models/Bank.js";

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
// HELPER: GET DEFAULT BANK
// ======================================================

const getDefaultBank = async () => {
  let bank = await Bank.findOne({
    status: "active",
  }).sort({ createdAt: 1 });

  if (!bank) {
    bank = await Bank.create({
      bankId: "SMB001",
      bankName: "Smart Bank",
      shortName: "SMB",
      ifscPrefix: "SMBK",
      status: "active",
    });
  }

  return bank;
};

// ======================================================
// HELPER: GENERATE UNIQUE IFSC
// Example: SMBK0123456
// ======================================================

const generateIfsc = async (bankPrefix = "SMBK") => {
  let prefix = String(bankPrefix || "SMBK")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);

  if (prefix.length < 4) {
    prefix = "SMBK";
  }

  let ifsc;
  let exists = true;

  while (exists) {
    const branchCode = Math.floor(
      100000 + Math.random() * 900000
    );

    ifsc = `${prefix}0${branchCode}`;

    exists = await Account.exists({
      ifsc,
    });
  }

  return ifsc;
};

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

    // --------------------------------------------------
    // Repair old accounts that do not have IFSC
    // --------------------------------------------------

    let defaultBank = null;

    for (const account of accounts) {
      let changed = false;

      // If old account has no bank, assign Smart Bank
      if (!account.bank) {
        if (!defaultBank) {
          defaultBank = await getDefaultBank();
        }

        account.bank = defaultBank._id;
        changed = true;
      }

      // If old account has no IFSC, generate one
      if (!account.ifsc || !String(account.ifsc).trim()) {
        if (!defaultBank) {
          defaultBank = await getDefaultBank();
        }

        account.ifsc = await generateIfsc(
          defaultBank.ifscPrefix
        );

        changed = true;
      }

      if (changed) {
        await account.save();
      }
    }

    // Populate bank information
    const updatedAccounts = await Account.find({
      user: req.user._id,
    })
      .populate(
        "bank",
        "bankName shortName ifscPrefix"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      accounts: updatedAccounts,
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
    }).populate(
      "bank",
      "bankName shortName ifscPrefix"
    );

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // --------------------------------------------------
    // Repair IFSC if missing
    // --------------------------------------------------

    if (!account.ifsc || !String(account.ifsc).trim()) {
      let bank = account.bank;

      if (!bank || !bank.ifscPrefix) {
        bank = await getDefaultBank();

        account.bank = bank._id;
      }

      account.ifsc = await generateIfsc(
        bank.ifscPrefix
      );

      await account.save();

      await account.populate(
        "bank",
        "bankName shortName ifscPrefix"
      );
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

    // ==================================================
    // ACCOUNT TYPE VALIDATION
    // ==================================================

    if (
      !accountType ||
      !ALLOWED_TYPES.includes(accountType)
    ) {
      return res.status(400).json({
        message: `accountType must be one of: ${ALLOWED_TYPES.join(
          ", "
        )}`,
      });
    }

    // ==================================================
    // INITIAL DEPOSIT VALIDATION
    // ==================================================

    const deposit =
      initialDeposit === undefined ||
      initialDeposit === null ||
      initialDeposit === ""
        ? 0
        : Number(initialDeposit);

    if (!Number.isFinite(deposit) || deposit < 0) {
      return res.status(400).json({
        message:
          "Initial deposit must be a valid positive number or 0",
      });
    }

    // ==================================================
    // PAN VALIDATION
    // PAN IS OPTIONAL
    // ==================================================

    let cleanPan = "";

    if (
      panNumber &&
      String(panNumber).trim() !== ""
    ) {
      cleanPan = String(panNumber)
        .trim()
        .toUpperCase();

      const panRegex =
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (!panRegex.test(cleanPan)) {
        return res.status(400).json({
          message:
            "Invalid PAN number. Please enter a valid PAN or leave it empty.",
        });
      }
    }

    // ==================================================
    // AADHAAR VALIDATION
    // OPTIONAL
    // ==================================================

    let cleanAadhaar = "";

    if (
      aadhaarNumber &&
      String(aadhaarNumber).trim() !== ""
    ) {
      cleanAadhaar = String(aadhaarNumber)
        .replace(/\s/g, "");

      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({
          message:
            "Aadhaar number must contain exactly 12 digits.",
        });
      }
    }

    // ==================================================
    // NOMINEE DETAILS
    // ==================================================

    const cleanNomineeName = nomineeName
      ? String(nomineeName).trim()
      : "";

    const cleanNomineePhone = nomineePhone
      ? String(nomineePhone).trim()
      : "";

    const cleanNomineeRelationship =
      nomineeRelationship
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

    // ==================================================
    // GET / CREATE DEFAULT BANK
    // ==================================================

    const bankDocument = await getDefaultBank();

    // ==================================================
    // GENERATE ACCOUNT NUMBER
    // ==================================================

    const accountNumber =
      await Account.generateAccountNumber();

    // ==================================================
    // GENERATE IFSC
    // ==================================================

    const ifsc = await generateIfsc(
      bankDocument.ifscPrefix
    );

    // ==================================================
    // GENERATE UPI ID
    // ==================================================

    const upiId = await Account.generateUpiId(
      req.user,
      req.user.name
    );

    // ==================================================
    // USER BASIC DETAILS
    // ==================================================

    const finalName =
      req.user.name ||
      req.user.fullName ||
      "";

    const finalEmail =
      req.user.email ||
      "";

    const finalMobile =
      req.user.mobileNumber ||
      req.user.phone ||
      "";

    // ==================================================
    // CREATE ACCOUNT
    // ==================================================

    const account = await Account.create({
      user: req.user._id,

      // Automatically assigned bank
      bank: bankDocument._id,

      // Automatically generated account number
      accountNumber,

      accountType,

      // Basic user information
      fullName: finalName,
      email: finalEmail,
      mobileNumber: finalMobile,

      // Balance
      balance: deposit,
      currency: "INR",

      // Automatically generated IFSC
      ifsc,

      // Automatically generated UPI
      upiId,

      // KYC
      panNumber: cleanPan,
      aadhaarNumber: cleanAadhaar,

      // Nominee
      nomineeName: cleanNomineeName,
      nomineeRelationship:
        cleanNomineeRelationship,
      nomineePhone: cleanNomineePhone,

      // Account status
      status: "active",
    });

    // ==================================================
    // INITIAL DEPOSIT TRANSACTION
    // ==================================================

    let transaction = null;

    if (deposit > 0) {
      transaction = await Transaction.create({
        user: req.user._id,

        account: account._id,

        type: "income",

        category: "Initial Deposit",

        amount: deposit,

        description: "Initial account deposit",

        status: "SUCCESS",

        referenceNumber:
          Transaction.generateReference(),
      });
    }

    // ==================================================
    // NOTIFICATION
    // ==================================================

    await notify(
      req.user._id,
      "Account Created",
      `A new ${accountType} account (•••• ${accountNumber.slice(
        -4
      )}) has been created successfully. IFSC: ${ifsc}`,
      "account"
    );

    // ==================================================
    // POPULATE BANK
    // ==================================================

    await account.populate(
      "bank",
      "bankName shortName ifscPrefix"
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    res.status(201).json({
      message:
        "Account created successfully",
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

router.put(
  "/:id/status",
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (
        !["active", "inactive"].includes(status)
      ) {
        return res.status(400).json({
          message:
            "status must be 'active' or 'inactive'",
        });
      }

      if (
        !mongoose.isValidObjectId(req.params.id)
      ) {
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
        message:
          "Account status updated successfully",
        account,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// CREDIT MONEY
// POST /api/accounts/:id/credit
// ======================================================

router.post(
  "/:id/credit",
  async (req, res, next) => {
    try {
      const { amount, description } =
        req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "amount must be a positive number",
        });
      }

      const account =
        await Account.findOne({
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
      const transaction =
        await Transaction.create({
          user: req.user._id,

          account: account._id,

          type: "income",

          category: "Credit",

          amount: numericAmount,

          description:
            description ||
            "Money credited",

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
        message:
          "Money credited successfully",
        account,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// DEBIT MONEY
// POST /api/accounts/:id/debit
// ======================================================

router.post(
  "/:id/debit",
  async (req, res, next) => {
    try {
      const { amount, description } =
        req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "amount must be a positive number",
        });
      }

      const account =
        await Account.findOne({
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
      const fresh =
        await Account.findById(account._id);

      if (!fresh) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      if (
        fresh.balance < numericAmount
      ) {
        return res.status(400).json({
          message:
            "Insufficient balance.",
        });
      }

      // Decrease balance
      fresh.balance -= numericAmount;

      await fresh.save();

      // Create transaction
      const transaction =
        await Transaction.create({
          user: req.user._id,

          account: fresh._id,

          type: "expense",

          category: "Debit",

          amount: numericAmount,

          description:
            description ||
            "Money debited",

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
        message:
          "Money debited successfully",
        account: fresh,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;