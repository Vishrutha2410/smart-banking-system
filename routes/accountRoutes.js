import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Bank from "../models/Bank.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const ACCOUNT_TYPES = ["Savings", "Current", "Salary"];

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
    bankId: "BOB001",
    bankName: "Bank of Baroda",
    shortName: "BOB",
    ifscPrefix: "BARB",
  },
  {
    bankId: "SMB001",
    bankName: "Smart Bank",
    shortName: "SMB",
    ifscPrefix: "SMBK",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const generateAccountNumber = () => {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${time}${random}`;
};

const generateIfsc = (prefix) => {
  const safePrefix = String(prefix || "SMBK")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  const number = Math.floor(100000 + Math.random() * 900000);

  return `${safePrefix}0${number}`;
};

const isValidIfsc = (ifsc) => {
  return /^[A-Z]{4}0\d{6}$/.test(
    String(ifsc || "").toUpperCase()
  );
};

const generateTransactionReference = () => {
  return `TXN${Date.now()}${Math.floor(
    1000 + Math.random() * 9000
  )}`;
};

const generateReferenceNumber = () => {
  return `REF${Date.now()}${Math.floor(
    1000 + Math.random() * 9000
  )}`;
};

/* =========================================================
   NORMALIZE BANK NAME
========================================================= */

const normalizeBankName = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

/*
 * Examples:
 *
 * "Smart Bank" -> "smartbank"
 * "SmartBank"  -> "smartbank"
 * "HDFC Bank"  -> "hdfcbank"
 * "HDFC BANK"  -> "hdfcbank"
 */

const getBankIdentity = (bank) => {
  if (!bank) return "";

  /*
   * Prefer the official short name.
   * This makes:
   *
   * SMB -> SMB
   * Smart Bank -> SMB
   * SmartBank -> SMB
   */

  if (bank.shortName) {
    const shortName = String(
      bank.shortName
    )
      .trim()
      .toUpperCase();

    if (shortName) {
      return `short:${shortName}`;
    }
  }

  return `name:${normalizeBankName(
    bank.bankName
  )}`;
};

/* =========================================================
   ENSURE DEFAULT BANKS
========================================================= */

const ensureDefaultBanks = async () => {
  for (const bank of DEFAULT_BANKS) {
    await Bank.findOneAndUpdate(
      {
        bankId: bank.bankId,
      },
      {
        $set: {
          bankName: bank.bankName,
          shortName: bank.shortName,
          ifscPrefix: bank.ifscPrefix,
          status: "active",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
};

/* =========================================================
   GET DEFAULT BANK
========================================================= */

const getDefaultBank = async () => {
  await ensureDefaultBanks();

  return Bank.findOne({
    status: "active",
  }).sort({
    bankName: 1,
    _id: 1,
  });
};

/* =========================================================
   FIND CANONICAL BANK
========================================================= */

const findCanonicalBank = async (bank) => {
  if (!bank) return null;

  /*
   * First try official bankId.
   */
  if (bank.bankId) {
    const byBankId = await Bank.findOne({
      bankId: bank.bankId,
      status: "active",
    });

    if (byBankId) {
      return byBankId;
    }
  }

  /*
   * Then try shortName.
   *
   * This fixes cases such as:
   *
   * Smart Bank
   * SmartBank
   *
   * both becoming SMB.
   */
  if (bank.shortName) {
    const byShortName = await Bank.findOne({
      shortName: String(
        bank.shortName
      ).toUpperCase(),
      status: "active",
    }).sort({
      createdAt: 1,
      _id: 1,
    });

    if (byShortName) {
      return byShortName;
    }
  }

  /*
   * Finally try normalized name.
   */
  const allBanks = await Bank.find({
    status: "active",
  }).sort({
    createdAt: 1,
    _id: 1,
  });

  const identity =
    normalizeBankName(
      bank.bankName
    );

  return (
    allBanks.find(
      (item) =>
        normalizeBankName(
          item.bankName
        ) === identity
    ) || null
  );
};

/* =========================================================
   REPAIR ACCOUNT BANK
========================================================= */

const repairAccount = async (account) => {
  let bank = null;

  if (account.bank) {
    bank = await Bank.findById(
      account.bank
    );
  }

  if (
    !bank ||
    !bank.bankId ||
    !bank.bankName ||
    !bank.ifscPrefix
  ) {
    bank = await findCanonicalBank(
      bank
    );
  }

  if (!bank) {
    bank = await getDefaultBank();
  }

  if (!bank) {
    return account;
  }

  let changed = false;

  if (
    !account.bank ||
    String(account.bank) !==
      String(bank._id)
  ) {
    account.bank = bank._id;
    changed = true;
  }

  if (!isValidIfsc(account.ifsc)) {
    account.ifsc = generateIfsc(
      bank.ifscPrefix
    );
    changed = true;
  }

  if (changed) {
    await account.save();
  }

  return account;
};

/* =========================================================
   GET BANKS
========================================================= */

router.get(
  "/banks",
  protect,
  async (req, res) => {
    try {
      await ensureDefaultBanks();

      const allBanks =
        await Bank.find({
          status: "active",
        })
          .select(
            "bankId bankName shortName ifscPrefix status"
          )
          .sort({
            bankName: 1,
            _id: 1,
          });

      /*
       * IMPORTANT:
       *
       * Remove duplicate database bank records
       * before sending them to the frontend.
       */
      const uniqueBanks = [];
      const seen = new Set();

      for (const bank of allBanks) {
        const identity =
          getBankIdentity(bank);

        if (seen.has(identity)) {
          continue;
        }

        seen.add(identity);
        uniqueBanks.push(bank);
      }

      res.json({
        banks: uniqueBanks,
      });
    } catch (error) {
      console.error(
        "GET BANKS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load banks",
      });
    }
  }
);

/* =========================================================
   GET USER ACCOUNTS
========================================================= */

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      await ensureDefaultBanks();

      const accounts =
        await Account.find({
          user: req.user._id,
        })
          .select(
            "-transactionPinHash"
          )
          .sort({
            createdAt: -1,
          });

      for (const account of accounts) {
        await repairAccount(
          account
        );
      }

      const updatedAccounts =
        await Account.find({
          user: req.user._id,
        })
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        accounts:
          updatedAccounts,
      });
    } catch (error) {
      console.error(
        "GET ACCOUNTS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load accounts",
      });
    }
  }
);

/* =========================================================
   GET SINGLE ACCOUNT
========================================================= */

router.get(
  "/:id",
  protect,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid account ID",
        });
      }

      let account =
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

      account =
        await repairAccount(
          account
        );

      const populatedAccount =
        await Account.findById(
          account._id
        )
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          );

      res.json({
        account:
          populatedAccount,
      });
    } catch (error) {
      console.error(
        "GET SINGLE ACCOUNT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load account",
      });
    }
  }
);

/* =========================================================
   CREATE ACCOUNT
========================================================= */

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        bankId,
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
        transactionPin,
      } = req.body;

      if (!bankId) {
        return res.status(400).json({
          message:
            "Please select a bank",
        });
      }

      if (
        !ACCOUNT_TYPES.includes(
          accountType
        )
      ) {
        return res.status(400).json({
          message:
            "Account type must be Savings, Current, or Salary",
        });
      }

      if (!fullName?.trim()) {
        return res.status(400).json({
          message:
            "Full name is required",
        });
      }

      if (!email?.trim()) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      if (!mobileNumber?.trim()) {
        return res.status(400).json({
          message:
            "Mobile number is required",
        });
      }

      if (!pincode?.trim()) {
        return res.status(400).json({
          message:
            "Pincode is required",
        });
      }

      if (!transactionPin) {
        return res.status(400).json({
          message:
            "Transaction PIN is required",
        });
      }

      if (
        !/^\d{4}$/.test(
          String(transactionPin)
        )
      ) {
        return res.status(400).json({
          message:
            "Transaction PIN must contain exactly 4 digits",
        });
      }

      const depositAmount =
        Number(
          initialDeposit || 0
        );

      if (
        Number.isNaN(
          depositAmount
        ) ||
        depositAmount < 0
      ) {
        return res.status(400).json({
          message:
            "Initial deposit must be a valid amount",
        });
      }

      if (
        panNumber &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
          String(
            panNumber
          ).trim()
        )
      ) {
        return res.status(400).json({
          message:
            "Enter a valid PAN number",
        });
      }

      if (
        aadhaarNumber &&
        !/^\d{12}$/.test(
          String(
            aadhaarNumber
          ).replace(/\s/g, "")
        )
      ) {
        return res.status(400).json({
          message:
            "Enter a valid 12-digit Aadhaar number",
        });
      }

      if (
        nomineePhone &&
        !/^\d{10}$/.test(
          String(
            nomineePhone
          ).replace(/\D/g, "")
        )
      ) {
        return res.status(400).json({
          message:
            "Enter a valid 10-digit nominee phone number",
        });
      }

      await ensureDefaultBanks();

      if (
        !mongoose.Types.ObjectId.isValid(
          bankId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid bank selected",
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
            "Selected bank is not available",
        });
      }

      /*
       * ONE BANK + ONE ACCOUNT TYPE
       *
       * Allowed:
       * SBI Savings
       * SBI Current
       * SBI Salary
       *
       * Not allowed:
       * SBI Savings
       * SBI Savings again
       */

      const existingSameTypeAccount =
        await Account.findOne({
          user: req.user._id,
          bank: bank._id,
          accountType,
        });

      if (
        existingSameTypeAccount
      ) {
        return res.status(409).json({
          message: `You already have a ${accountType} account with ${bank.bankName}. You cannot create another ${accountType} account with this bank.`,
          code:
            "DUPLICATE_ACCOUNT_TYPE",
        });
      }

      let accountNumber;
      let accountNumberExists = true;

      while (
        accountNumberExists
      ) {
        accountNumber =
          generateAccountNumber();

        const existing =
          await Account.findOne({
            accountNumber,
          });

        accountNumberExists =
          Boolean(existing);
      }

      let ifsc =
        generateIfsc(
          bank.ifscPrefix
        );

      let ifscExists =
        await Account.findOne({
          ifsc,
        });

      while (ifscExists) {
        ifsc =
          generateIfsc(
            bank.ifscPrefix
          );

        ifscExists =
          await Account.findOne({
            ifsc,
          });
      }

      const upiId =
        `${accountNumber}@${String(
          bank.shortName
        ).toLowerCase()}`;

      const transactionPinHash =
        await bcrypt.hash(
          String(
            transactionPin
          ),
          10
        );

      const account =
        await Account.create({
          user: req.user._id,

          bank: bank._id,

          accountNumber,

          accountType,

          balance:
            depositAmount,

          currency: "INR",

          ifsc,

          upiId,

          status: "active",

          fullName:
            fullName.trim(),

          email:
            email.trim(),

          mobileNumber:
            mobileNumber.trim(),

          dateOfBirth:
            dateOfBirth ||
            null,

          gender:
            gender || "",

          address:
            address?.trim() ||
            "",

          city:
            city?.trim() || "",

          state:
            state?.trim() || "",

          pincode:
            pincode.trim(),

          panNumber: panNumber
            ? String(
                panNumber
              )
                .trim()
                .toUpperCase()
            : "",

          aadhaarNumber:
            aadhaarNumber
              ? String(
                  aadhaarNumber
                ).replace(
                  /\s/g,
                  ""
                )
              : "",

          nomineeName:
            nomineeName?.trim() ||
            "",

          nomineeRelationship:
            nomineeRelationship ||
            "",

          nomineePhone:
            nomineePhone?.trim() ||
            "",

          transactionPinHash,
        });

      if (depositAmount > 0) {
        await Transaction.create({
          user: req.user._id,

          account:
            account._id,

          type: "income",

          transactionKind:
            "INCOME",

          amount:
            depositAmount,

          category:
            "Initial Deposit",

          description:
            "Initial account deposit",

          transferMethod: null,

          status: "SUCCESS",

          referenceNumber:
            generateReferenceNumber(),

          transactionId:
            generateTransactionReference(),

          date: new Date(),
        });
      }

      const populatedAccount =
        await Account.findById(
          account._id
        )
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          );

      res.status(201).json({
        message: `${accountType} account created successfully with ${bank.bankName}`,

        account:
          populatedAccount,
      });
    } catch (error) {
      console.error(
        "CREATE ACCOUNT ERROR:",
        error
      );

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          message:
            "An account with the selected bank and account type already exists.",
          code:
            "DUPLICATE_ACCOUNT_TYPE",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          message:
            firstError?.message ||
            "Please check the account details",
        });
      }

      res.status(500).json({
        message:
          "Unable to create account",
      });
    }
  }
);

/* =========================================================
   UPDATE ACCOUNT STATUS
========================================================= */

router.put(
  "/:id/status",
  protect,
  async (req, res) => {
    try {
      const { status } =
        req.body;

      if (
        ![
          "active",
          "inactive",
          "blocked",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid account status",
        });
      }

      const account =
        await Account.findOneAndUpdate(
          {
            _id: req.params.id,
            user: req.user._id,
          },
          {
            status,
          },
          {
            new: true,
          }
        )
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          );

      if (!account) {
        return res.status(404).json({
          message:
            "Account not found",
        });
      }

      res.json({
        message:
          "Account status updated successfully",

        account,
      });
    } catch (error) {
      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to update account status",
      });
    }
  }
);

/* =========================================================
   CREDIT
========================================================= */

router.post(
  "/:id/credit",
  protect,
  async (req, res) => {
    try {
      const {
        amount,
        description,
      } = req.body;

      const numericAmount =
        Number(amount);

      if (
        Number.isNaN(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Enter a valid credit amount",
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

      if (
        account.status !==
        "active"
      ) {
        return res.status(400).json({
          message:
            "This account is not active",
        });
      }

      account.balance +=
        numericAmount;

      await account.save();

      await Transaction.create({
        user: req.user._id,

        account:
          account._id,

        type: "income",

        transactionKind:
          "INCOME",

        amount:
          numericAmount,

        category:
          "Credit",

        description:
          description?.trim() ||
          "Amount credited",

        transferMethod: null,

        status: "SUCCESS",

        referenceNumber:
          generateReferenceNumber(),

        transactionId:
          generateTransactionReference(),

        date: new Date(),
      });

      const updatedAccount =
        await Account.findById(
          account._id
        )
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          );

      res.json({
        message:
          "Amount credited successfully",

        account:
          updatedAccount,
      });
    } catch (error) {
      console.error(
        "CREDIT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to credit amount",
      });
    }
  }
);

/* =========================================================
   DEBIT
========================================================= */

router.post(
  "/:id/debit",
  protect,
  async (req, res) => {
    try {
      const {
        amount,
        description,
      } = req.body;

      const numericAmount =
        Number(amount);

      if (
        Number.isNaN(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Enter a valid debit amount",
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

      if (
        account.status !==
        "active"
      ) {
        return res.status(400).json({
          message:
            "This account is not active",
        });
      }

      if (
        account.balance <
        numericAmount
      ) {
        return res.status(400).json({
          message:
            "Insufficient balance",
        });
      }

      account.balance -=
        numericAmount;

      await account.save();

      await Transaction.create({
        user: req.user._id,

        account:
          account._id,

        type: "expense",

        transactionKind:
          "EXPENSE",

        amount:
          numericAmount,

        category:
          "Debit",

        description:
          description?.trim() ||
          "Amount debited",

        transferMethod: null,

        status: "SUCCESS",

        referenceNumber:
          generateReferenceNumber(),

        transactionId:
          generateTransactionReference(),

        date: new Date(),
      });

      const updatedAccount =
        await Account.findById(
          account._id
        )
          .populate(
            "bank",
            "bankId bankName shortName ifscPrefix status"
          )
          .select(
            "-transactionPinHash"
          );

      res.json({
        message:
          "Amount debited successfully",

        account:
          updatedAccount,
      });
    } catch (error) {
      console.error(
        "DEBIT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Unable to debit amount",
      });
    }
  }
);

export default router;