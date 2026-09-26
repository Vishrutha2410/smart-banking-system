import express from "express";
import mongoose from "mongoose";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";
import { evaluateTransactionForFraud } from "../services/fraudService.js";

const router = express.Router();

router.use(protect);

const ALLOWED_TYPES = [
  "Savings",
  "Current",
  "Salary",
];

// ---------------------------------------------
// GET ALL ACCOUNTS
// ---------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
    })
      .populate(
        "bank",
        "bankName shortName ifscPrefix"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      accounts,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// GET SINGLE ACCOUNT
// ---------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid account id",
      });
    }

    const account =
      await Account.findOne({
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

    res.status(200).json({
      account,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// CREATE ACCOUNT
// ---------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const {
      accountType,

      fullName,
      email,
      mobileNumber,

      dateOfBirth,
      gender,

      address,
      city,
      state,
      pincode,

      panNumber,
      aadhaarNumber,

      nomineeName,
      nomineeRelationship,
      nomineePhone,

      initialDeposit,

      bank,
      ifsc,
    } = req.body;

    // -----------------------------------------
    // Validate account type
    // -----------------------------------------
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

    // -----------------------------------------
    // Use Google / registered profile data
    // if frontend didn't send a value
    // -----------------------------------------
    const finalName =
      fullName?.trim() ||
      req.user.name?.trim();

    const finalEmail =
      email?.trim() ||
      req.user.email?.trim();

    const finalMobile =
      mobileNumber?.trim() ||
      req.user.phone?.trim() ||
      "";

    const finalAddress =
      address?.trim() ||
      req.user.address?.trim() ||
      "";

    // -----------------------------------------
    // Basic validation
    // -----------------------------------------
    if (!finalName) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!finalEmail) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    if (
      mobileNumber &&
      !/^[6-9]\d{9}$/.test(
        mobileNumber.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    if (
      pincode &&
      !/^\d{6}$/.test(
        pincode.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Pincode must contain exactly 6 digits.",
      });
    }

    // -----------------------------------------
    // PAN validation
    // -----------------------------------------
    if (
      panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        panNumber.trim().toUpperCase()
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid PAN number.",
      });
    }

    // -----------------------------------------
    // Aadhaar validation
    // -----------------------------------------
    if (
      aadhaarNumber &&
      !/^\d{12}$/.test(
        aadhaarNumber.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Aadhaar number must contain 12 digits.",
      });
    }

    // -----------------------------------------
    // Initial deposit
    // -----------------------------------------
    const numericDeposit =
      Number(initialDeposit) || 0;

    if (numericDeposit < 0) {
      return res.status(400).json({
        message:
          "Initial deposit cannot be negative.",
      });
    }

    // -----------------------------------------
    // Generate account number
    // -----------------------------------------
    const accountNumber =
      await Account.generateAccountNumber();

    // -----------------------------------------
    // Generate UPI ID
    // -----------------------------------------
    const upiId =
      await Account.generateUpiId(
        req.user,
        finalName
      );

    // -----------------------------------------
    // Create account
    // -----------------------------------------
    const account =
      await Account.create({
        user: req.user._id,

        bank: bank || null,

        accountNumber,

        accountType,

        fullName: finalName,

        email: finalEmail,

        mobileNumber: finalMobile,

        dateOfBirth:
          dateOfBirth || null,

        gender: gender || "",

        address: finalAddress,

        city:
          city?.trim() || "",

        state:
          state?.trim() || "",

        pincode:
          pincode?.trim() || "",

        panNumber:
          panNumber
            ?.trim()
            .toUpperCase() || "",

        aadhaarNumber:
          aadhaarNumber?.trim() || "",

        nomineeName:
          nomineeName?.trim() || "",

        nomineeRelationship:
          nomineeRelationship?.trim() ||
          "",

        nomineePhone:
          nomineePhone?.trim() || "",

        balance: numericDeposit,

        currency: "INR",

        ifsc:
          ifsc?.trim().toUpperCase() || "",

        upiId,

        status: "active",
      });

    // -----------------------------------------
    // If initial deposit exists,
    // create an income transaction
    // -----------------------------------------
    let transaction = null;

    if (numericDeposit > 0) {
      transaction =
        await Transaction.create({
          user: req.user._id,

          account: account._id,

          type: "income",

          category: "Initial Deposit",

          amount: numericDeposit,

          description:
            "Initial account deposit",

          status: "completed",

          referenceNumber:
            Transaction.generateReference(),
        });
    }

    // -----------------------------------------
    // Notification
    // -----------------------------------------
    await notify(
      req.user._id,

      "Account Created",

      `Your ${accountType} account •••• ${accountNumber.slice(
        -4
      )} has been created successfully.`,

      "account"
    );

    // -----------------------------------------
    // Response
    // -----------------------------------------
    res.status(201).json({
      message:
        "Bank account created successfully.",

      account,

      transaction,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// UPDATE ACCOUNT STATUS
// ---------------------------------------------
router.put(
  "/:id/status",
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "status must be 'active' or 'inactive'",
        });
      }

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const account =
        await Account.findOne({
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
        account,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------------------------------
// CREDIT MONEY
// ---------------------------------------------
router.post(
  "/:id/credit",
  async (req, res, next) => {
    try {
      const {
        amount,
        description,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !numericAmount ||
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

      if (
        account.status !== "active"
      ) {
        return res.status(400).json({
          message:
            "Cannot credit an inactive account",
        });
      }

      account.balance += numericAmount;

      await account.save();

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

          status: "completed",

          referenceNumber:
            Transaction.generateReference(),
        });

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
        account,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------------------------------
// DEBIT MONEY
// ---------------------------------------------
router.post(
  "/:id/debit",
  async (req, res, next) => {
    try {
      const {
        amount,
        description,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !numericAmount ||
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

      if (
        account.status !== "active"
      ) {
        return res.status(400).json({
          message:
            "Cannot debit an inactive account",
        });
      }

      const fresh =
        await Account.findById(
          account._id
        );

      if (
        fresh.balance <
        numericAmount
      ) {
        return res.status(400).json({
          message:
            "Insufficient balance.",
        });
      }

      fresh.balance -= numericAmount;

      await fresh.save();

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

          status: "completed",

          referenceNumber:
            Transaction.generateReference(),
        });

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
        account: fresh,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;