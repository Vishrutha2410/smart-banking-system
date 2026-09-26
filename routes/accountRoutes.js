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
// DEFAULT BANKS
// These are simulated banks for this project.
// ======================================================

const DEFAULT_BANKS = [
  {
    bankId: "SBI001",
    bankName: "State Bank of India",
    shortName: "SBI",
    ifscPrefix: "SBIN",
  },
  {
    bankId: "HDFC001",
    bankName: "HDFC Bank",
    shortName: "HDFC",
    ifscPrefix: "HDFC",
  },
  {
    bankId: "ICICI001",
    bankName: "ICICI Bank",
    shortName: "ICICI",
    ifscPrefix: "ICIC",
  },
  {
    bankId: "AXIS001",
    bankName: "Axis Bank",
    shortName: "AXIS",
    ifscPrefix: "UTIB",
  },
  {
    bankId: "SMB001",
    bankName: "Smart Bank",
    shortName: "SMB",
    ifscPrefix: "SMBK",
  },
];

// ======================================================
// HELPER: ENSURE BANKS EXIST
// ======================================================

const ensureDefaultBanks = async () => {
  const banks = [];

  for (const bankData of DEFAULT_BANKS) {
    const bank = await Bank.findOneAndUpdate(
      {
        bankId: bankData.bankId,
      },
      {
        $setOnInsert: bankData,
      },
      {
        new: true,
        upsert: true,
      }
    );

    banks.push(bank);
  }

  return banks;
};

// ======================================================
// HELPER: GET DEFAULT BANK
// ======================================================

const getDefaultBank = async () => {
  await ensureDefaultBanks();

  const bank = await Bank.findOne({
    status: "active",
  }).sort({
    createdAt: 1,
  });

  return bank;
};

// ======================================================
// HELPER: GENERATE UNIQUE IFSC
// Example:
// SBIN0123456
// HDFC0456789
// ICIC0234567
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
// GET AVAILABLE BANKS
// GET /api/accounts/banks
//
// This route must appear BEFORE /:id
// ======================================================

router.get("/banks", async (req, res, next) => {
  try {
    await ensureDefaultBanks();

    const banks = await Bank.find({
      status: "active",
    })
      .select(
        "_id bankId bankName shortName ifscPrefix status"
      )
      .sort({
        bankName: 1,
      });

    // Find banks where this user already has an account
    const existingAccounts = await Account.find({
      user: req.user._id,
      bank: {
        $ne: null,
      },
    }).select("bank");

    const usedBankIds = new Set(
      existingAccounts
        .filter((account) => account.bank)
        .map((account) =>
          account.bank.toString()
        )
    );

    const banksWithAvailability = banks.map(
      (bank) => ({
        ...bank.toObject(),
        alreadyUsed: usedBankIds.has(
          bank._id.toString()
        ),
      })
    );

    res.status(200).json({
      banks: banksWithAvailability,
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// GET ALL ACCOUNTS
// GET /api/accounts
// ======================================================

router.get("/", async (req, res, next) => {
  try {
    const accounts = await Account.find({
      user: req.user._id,
    })
      .populate(
        "bank",
        "bankId bankName shortName ifscPrefix"
      )
      .sort({
        createdAt: -1,
      });

    // --------------------------------------------------
    // Repair old accounts that do not have bank / IFSC
    // --------------------------------------------------

    let defaultBank = null;

    for (const account of accounts) {
      let changed = false;

      // Old account without bank
      if (!account.bank) {
        if (!defaultBank) {
          defaultBank = await getDefaultBank();
        }

        account.bank = defaultBank._id;
        changed = true;
      }

      // Old account without IFSC
      if (
        !account.ifsc ||
        !String(account.ifsc).trim()
      ) {
        let bankForIfsc = account.bank;

        if (
          !bankForIfsc ||
          !bankForIfsc.ifscPrefix
        ) {
          if (!defaultBank) {
            defaultBank =
              await getDefaultBank();
          }

          account.bank =
            defaultBank._id;

          bankForIfsc = defaultBank;
        }

        const bankPrefix =
          bankForIfsc.ifscPrefix ||
          defaultBank?.ifscPrefix ||
          "SMBK";

        account.ifsc =
          await generateIfsc(bankPrefix);

        changed = true;
      }

      if (changed) {
        await account.save();
      }
    }

    // Fetch again after repair
    const updatedAccounts =
      await Account.find({
        user: req.user._id,
      })
        .populate(
          "bank",
          "bankId bankName shortName ifscPrefix"
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
        "bankId bankName shortName ifscPrefix"
      );

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Repair missing bank / IFSC
    if (!account.bank || !account.ifsc) {
      let bank;

      if (
        account.bank &&
        account.bank.ifscPrefix
      ) {
        bank = account.bank;
      } else {
        bank = await getDefaultBank();
        account.bank = bank._id;
      }

      if (
        !account.ifsc ||
        !String(account.ifsc).trim()
      ) {
        account.ifsc =
          await generateIfsc(
            bank.ifscPrefix
          );
      }

      await account.save();

      await account.populate(
        "bank",
        "bankId bankName shortName ifscPrefix"
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
      bankId,

      fullName,
      email,
      mobileNumber,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,

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
      !ALLOWED_TYPES.includes(
        accountType
      )
    ) {
      return res.status(400).json({
        message: `accountType must be one of: ${ALLOWED_TYPES.join(
          ", "
        )}`,
      });
    }

    // ==================================================
    // BANK VALIDATION
    // ==================================================

    if (!bankId) {
      return res.status(400).json({
        message:
          "Please select a bank before creating the account.",
      });
    }

    if (
      !mongoose.isValidObjectId(bankId)
    ) {
      return res.status(400).json({
        message: "Invalid bank selected.",
      });
    }

    const bank =
      await Bank.findOne({
        _id: bankId,
        status: "active",
      });

    if (!bank) {
      return res.status(404).json({
        message:
          "Selected bank is not available.",
      });
    }

    // ==================================================
    // ONE ACCOUNT PER BANK
    // ==================================================

    const existingAccount =
      await Account.findOne({
        user: req.user._id,
        bank: bank._id,
      });

    if (existingAccount) {
      return res.status(400).json({
        message: `You already have an account with ${bank.bankName}. Only one account per bank is allowed.`,
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

    if (
      !Number.isFinite(deposit) ||
      deposit < 0
    ) {
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
      cleanAadhaar = String(
        aadhaarNumber
      ).replace(/\s/g, "");

      if (
        !/^\d{12}$/.test(
          cleanAadhaar
        )
      ) {
        return res.status(400).json({
          message:
            "Aadhaar number must contain exactly 12 digits.",
        });
      }
    }

    // ==================================================
    // NOMINEE DETAILS
    // ==================================================

    const cleanNomineeName =
      nomineeName
        ? String(nomineeName).trim()
        : "";

    const cleanNomineePhone =
      nomineePhone
        ? String(nomineePhone).trim()
        : "";

    const cleanNomineeRelationship =
      nomineeRelationship
        ? String(
            nomineeRelationship
          ).trim()
        : "";

    if (
      cleanNomineeRelationship &&
      !ALLOWED_NOMINEE_RELATIONSHIPS.includes(
        cleanNomineeRelationship
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid nominee relationship.",
      });
    }

    if (cleanNomineePhone) {
      const phoneRegex = /^\d{10}$/;

      if (
        !phoneRegex.test(
          cleanNomineePhone
        )
      ) {
        return res.status(400).json({
          message:
            "Nominee phone number must contain exactly 10 digits.",
        });
      }
    }

    // ==================================================
    // GENERATE ACCOUNT NUMBER
    // ==================================================

    const accountNumber =
      await Account.generateAccountNumber();

    // ==================================================
    // GENERATE BANK-SPECIFIC IFSC
    // ==================================================

    const ifsc =
      await generateIfsc(
        bank.ifscPrefix
      );

    // ==================================================
    // GENERATE UPI ID
    // ==================================================

    const upiId =
      await Account.generateUpiId(
        req.user,
        req.user.name
      );

    // ==================================================
    // USER DETAILS
    // ==================================================

    const finalName =
      fullName?.trim() ||
      req.user.name ||
      "";

    const finalEmail =
      email?.trim() ||
      req.user.email ||
      "";

    const finalMobile =
      mobileNumber?.trim() ||
      req.user.mobileNumber ||
      req.user.phone ||
      "";

    // ==================================================
    // CREATE ACCOUNT
    // ==================================================

    const account =
      await Account.create({
        user: req.user._id,

        bank: bank._id,

        accountNumber,

        accountType,

        fullName: finalName,
        email: finalEmail,
        mobileNumber: finalMobile,

        dateOfBirth:
          dateOfBirth || null,

        gender:
          gender || "",

        address:
          address?.trim() || "",

        city:
          city?.trim() || "",

        state:
          state?.trim() || "",

        pincode:
          pincode?.trim() || "",

        balance: deposit,

        currency: "INR",

        ifsc,

        upiId,

        panNumber: cleanPan,

        aadhaarNumber:
          cleanAadhaar,

        nomineeName:
          cleanNomineeName,

        nomineeRelationship:
          cleanNomineeRelationship,

        nomineePhone:
          cleanNomineePhone,

        status: "active",
      });

    // ==================================================
    // INITIAL DEPOSIT TRANSACTION
    // ==================================================

    let transaction = null;

    if (deposit > 0) {
      transaction =
        await Transaction.create({
          user: req.user._id,

          account: account._id,

          type: "income",

          category:
            "Initial Deposit",

          amount: deposit,

          description:
            "Initial account deposit",

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
      `A new ${accountType} account with ${bank.bankName} (•••• ${accountNumber.slice(
        -4
      )}) has been created successfully. IFSC: ${ifsc}`,
      "account"
    );

    // ==================================================
    // POPULATE BANK
    // ==================================================

    await account.populate(
      "bank",
      "bankId bankName shortName ifscPrefix"
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
      const { status } =
        req.body;

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
          message:
            "Invalid account id",
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
            "Account not found",
        });
      }

      account.status =
        status;

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
          message:
            "Invalid account id",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
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
        account.status !==
        "active"
      ) {
        return res.status(400).json({
          message:
            "Cannot credit an inactive account",
        });
      }

      account.balance +=
        numericAmount;

      await account.save();

      const transaction =
        await Transaction.create({
          user: req.user._id,

          account: account._id,

          type: "income",

          category: "Credit",

          amount:
            numericAmount,

          description:
            description ||
            "Money credited",

          status: "SUCCESS",

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
          message:
            "Invalid account id",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
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
        account.status !==
        "active"
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

      if (!fresh) {
        return res.status(404).json({
          message:
            "Account not found",
        });
      }

      if (
        fresh.balance <
        numericAmount
      ) {
        return res.status(400).json({
          message:
            "Insufficient balance.",
        });
      }

      fresh.balance -=
        numericAmount;

      await fresh.save();

      const transaction =
        await Transaction.create({
          user: req.user._id,

          account: fresh._id,

          type: "expense",

          category: "Debit",

          amount:
            numericAmount,

          description:
            description ||
            "Money debited",

          status: "SUCCESS",

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