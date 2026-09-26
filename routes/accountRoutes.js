import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Bank from "../models/Bank.js";
import { protect } from "../middleware/authMiddleware.js";
import { evaluateTransactionForFraud } from "../services/fraudService.js";

const router = express.Router();

router.use(protect);

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_TYPES = ["Savings", "Current", "Salary"];

const ALLOWED_STATUSES = [
  "active",
  "inactive",
  "blocked",
];

/*
  These are the banks used by the Smart Banking System.

  bankId      -> unique project bank identifier
  bankName    -> full bank name
  shortName   -> short display name
  ifscPrefix  -> simulated IFSC prefix
*/
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

/* =========================================================
   HELPERS
========================================================= */

/*
  Create/repair the default banks.

  IMPORTANT:
  The previous code used:
    name
    code
    isActive

  The current Bank model uses:
    bankId
    bankName
    shortName
    ifscPrefix
    status
*/
const ensureDefaultBanks = async () => {
  for (const bank of DEFAULT_BANKS) {
    await Bank.findOneAndUpdate(
      {
        bankId: bank.bankId,
      },
      {
        $set: {
          bankId: bank.bankId,
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

/*
  Get the default active bank.
*/
const getDefaultBank = async () => {
  await ensureDefaultBanks();

  return Bank.findOne({
    status: "active",
  }).sort({
    bankName: 1,
  });
};

/*
  Generate simulated IFSC.

  Example:
  SBIN0123456
  HDFC0456789
  ICIC0987654
*/
const generateIfsc = (ifscPrefix) => {
  const randomBranch = Math.floor(
    100000 + Math.random() * 900000
  );

  return `${String(ifscPrefix).toUpperCase()}0${randomBranch}`;
};

/*
  Validate whether an IFSC belongs to the expected format.
*/
const isValidIfsc = (ifsc) => {
  if (!ifsc) {
    return false;
  }

  return /^[A-Z]{4}0\d{6}$/.test(
    String(ifsc).trim().toUpperCase()
  );
};

/*
  Generate a unique account number.
*/
const generateUniqueAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = String(
      Math.floor(
        1000000000 + Math.random() * 9000000000
      )
    );

    exists = await Account.exists({
      accountNumber,
    });
  }

  return accountNumber;
};

/*
  Generate UPI ID.
*/
const generateUpiId = (accountNumber, shortName) => {
  return `${accountNumber}@${String(
    shortName
  ).toLowerCase()}`;
};

/*
  Find bank using either:
    - MongoDB _id
    - project bankId
*/
const findActiveBank = async (bankId) => {
  if (!bankId) {
    return null;
  }

  let bank = null;

  /*
    First try MongoDB ObjectId.
  */
  if (mongoose.Types.ObjectId.isValid(bankId)) {
    bank = await Bank.findOne({
      _id: bankId,
      status: "active",
    });
  }

  /*
    If not found, try project bankId.
  */
  if (!bank) {
    bank = await Bank.findOne({
      bankId: String(bankId).trim().toUpperCase(),
      status: "active",
    });
  }

  return bank;
};

/*
  Repair an existing account if its bank or IFSC
  is missing/invalid.

  This is particularly useful for old accounts created
  before the bank schema was corrected.
*/
const repairAccountBankInformation = async (account) => {
  await ensureDefaultBanks();

  let bank = null;

  /*
    Try the account's existing bank reference.
  */
  if (account.bank) {
    bank = await Bank.findOne({
      _id: account.bank,
      status: "active",
    });
  }

  /*
    If the old bank reference is missing/invalid,
    find an active bank that is not already used
    by another account of this user.
  */
  if (!bank) {
    const usedBankIds = await Account.find({
      user: account.user,
      _id: {
        $ne: account._id,
      },
      bank: {
        $ne: null,
      },
    }).distinct("bank");

    bank = await Bank.findOne({
      status: "active",
      _id: {
        $nin: usedBankIds,
      },
    }).sort({
      bankName: 1,
    });
  }

  /*
    Final fallback.
  */
  if (!bank) {
    bank = await getDefaultBank();
  }

  if (!bank) {
    return account;
  }

  let needsSave = false;

  /*
    Repair bank.
  */
  if (
    !account.bank ||
    String(account.bank) !== String(bank._id)
  ) {
    account.bank = bank._id;
    needsSave = true;
  }

  /*
    Repair invalid/missing IFSC.
  */
  if (!isValidIfsc(account.ifsc)) {
    account.ifsc = generateIfsc(
      bank.ifscPrefix
    );

    needsSave = true;
  }

  /*
    Repair missing UPI.
  */
  if (!account.upiId && account.accountNumber) {
    account.upiId = generateUpiId(
      account.accountNumber,
      bank.shortName
    );

    needsSave = true;
  }

  if (needsSave) {
    await account.save();
  }

  return account;
};

/* =========================================================
   GET ALL BANKS
   GET /api/accounts/banks
========================================================= */

router.get("/banks", async (req, res, next) => {
  try {
    await ensureDefaultBanks();

    const banks = await Bank.find({
      status: "active",
    })
      .select(
        "bankId bankName shortName ifscPrefix status"
      )
      .sort({
        bankName: 1,
      })
      .lean();

    /*
      Find banks already used by this user.
    */
    const usedBankIds = await Account.find({
      user: req.user.id,
      bank: {
        $ne: null,
      },
    }).distinct("bank");

    const formattedBanks = banks.map((bank) => ({
      ...bank,

      /*
        Used/available indication for account creation UI.
      */
      alreadyUsed: usedBankIds.some(
        (usedId) =>
          String(usedId) === String(bank._id)
      ),

      available:
        !usedBankIds.some(
          (usedId) =>
            String(usedId) === String(bank._id)
        ),
    }));

    res.json({
      banks: formattedBanks,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET ALL ACCOUNTS
   GET /api/accounts
========================================================= */

router.get("/", async (req, res, next) => {
  try {
    await ensureDefaultBanks();

    let accounts = await Account.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    /*
      Repair old accounts before returning them.
    */
    for (const account of accounts) {
      await repairAccountBankInformation(account);
    }

    /*
      Re-fetch after repairs.
    */
    accounts = await Account.find({
      user: req.user.id,
    })
      .populate(
        "bank",
        "bankId bankName shortName ifscPrefix status"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      accounts,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET SINGLE ACCOUNT
   GET /api/accounts/:id
========================================================= */

router.get("/:id", async (req, res, next) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid account ID.",
      });
    }

    let account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    /*
      Repair bank information if required.
    */
    await repairAccountBankInformation(account);

    account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate(
      "bank",
      "bankId bankName shortName ifscPrefix status"
    );

    res.json({
      account,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE ACCOUNT
   POST /api/accounts
========================================================= */

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

      transactionPin,
    } = req.body;

    /* -----------------------------------------------------
       ACCOUNT TYPE VALIDATION
    ----------------------------------------------------- */

    if (!ALLOWED_TYPES.includes(accountType)) {
      return res.status(400).json({
        message: "Invalid account type.",
      });
    }

    /* -----------------------------------------------------
       BASIC PERSONAL DETAILS
    ----------------------------------------------------- */

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    /* -----------------------------------------------------
       TRANSACTION PIN VALIDATION
    ----------------------------------------------------- */

    if (!transactionPin) {
      return res.status(400).json({
        message: "Transaction PIN is required.",
      });
    }

    const cleanTransactionPin =
      String(transactionPin).trim();

    if (!/^\d{4}$/.test(cleanTransactionPin)) {
      return res.status(400).json({
        message:
          "Transaction PIN must contain exactly 4 digits.",
      });
    }

    /* -----------------------------------------------------
       MOBILE VALIDATION
    ----------------------------------------------------- */

    if (mobileNumber) {
      const cleanMobile = String(
        mobileNumber
      ).replace(/\D/g, "");

      if (cleanMobile.length !== 10) {
        return res.status(400).json({
          message:
            "Mobile number must contain 10 digits.",
        });
      }
    }

    /* -----------------------------------------------------
       PINCODE VALIDATION
    ----------------------------------------------------- */

    if (pincode) {
      const cleanPincode = String(
        pincode
      ).replace(/\D/g, "");

      if (cleanPincode.length !== 6) {
        return res.status(400).json({
          message:
            "Pincode must contain 6 digits.",
        });
      }
    }

    /* -----------------------------------------------------
       BANK
    ----------------------------------------------------- */

    await ensureDefaultBanks();

    let bank = await findActiveBank(bankId);

    /*
      If frontend did not provide a bank,
      use the first available active bank.
    */
    if (!bank) {
      bank = await getDefaultBank();
    }

    if (!bank) {
      return res.status(400).json({
        message:
          "No active bank is available.",
      });
    }

    /* -----------------------------------------------------
       ONE ACCOUNT PER BANK
    ----------------------------------------------------- */

    const existingAccount =
      await Account.findOne({
        user: req.user.id,
        bank: bank._id,
      });

    if (existingAccount) {
      return res.status(400).json({
        message: `You already have an account with ${bank.bankName}.`,
      });
    }

    /* -----------------------------------------------------
       INITIAL DEPOSIT
    ----------------------------------------------------- */

    const deposit = Number(
      initialDeposit || 0
    );

    if (
      !Number.isFinite(deposit) ||
      deposit < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid initial deposit.",
      });
    }

    /* -----------------------------------------------------
       PAN VALIDATION
    ----------------------------------------------------- */

    let cleanPan = "";

    if (panNumber) {
      cleanPan = String(panNumber)
        .trim()
        .toUpperCase();

      if (
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
          cleanPan
        )
      ) {
        return res.status(400).json({
          message: "Invalid PAN number.",
        });
      }
    }

    /* -----------------------------------------------------
       AADHAAR VALIDATION
    ----------------------------------------------------- */

    let cleanAadhaar = "";

    if (aadhaarNumber) {
      cleanAadhaar = String(
        aadhaarNumber
      )
        .replace(/\s/g, "")
        .trim();

      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({
          message: "Invalid Aadhaar number.",
        });
      }
    }

    /* -----------------------------------------------------
       NOMINEE VALIDATION
    ----------------------------------------------------- */

    if (
      nomineeName &&
      !nomineeRelationship
    ) {
      return res.status(400).json({
        message:
          "Nominee relationship is required.",
      });
    }

    let cleanNomineePhone = "";

    if (nomineePhone) {
      cleanNomineePhone = String(
        nomineePhone
      ).replace(/\D/g, "");

      if (
        cleanNomineePhone.length !== 10
      ) {
        return res.status(400).json({
          message:
            "Invalid nominee phone number.",
        });
      }
    }

    /* -----------------------------------------------------
       GENERATE ACCOUNT NUMBER
    ----------------------------------------------------- */

    const accountNumber =
      await generateUniqueAccountNumber();

    /* -----------------------------------------------------
       GENERATE IFSC
    ----------------------------------------------------- */

    const ifscCode = generateIfsc(
      bank.ifscPrefix
    );

    /* -----------------------------------------------------
       GENERATE UPI
    ----------------------------------------------------- */

    const upiId = generateUpiId(
      accountNumber,
      bank.shortName
    );

    /* -----------------------------------------------------
       HASH TRANSACTION PIN
    ----------------------------------------------------- */

    const transactionPinHash =
      await bcrypt.hash(
        cleanTransactionPin,
        10
      );

    /* -----------------------------------------------------
       CREATE ACCOUNT
    ----------------------------------------------------- */

    const account = await Account.create({
      user: req.user.id,

      accountNumber,
      accountType,

      /*
        Correct Bank reference.
      */
      bank: bank._id,

      /*
        Correct Account model field.
      */
      ifsc: ifscCode,

      upiId,

      balance: deposit,
      currency: "INR",

      /*
        Correct lowercase enum.
      */
      status: "active",

      fullName: String(fullName).trim(),

      email: String(email)
        .trim()
        .toLowerCase(),

      mobileNumber: mobileNumber
        ? String(mobileNumber)
            .replace(/\D/g, "")
        : "",

      dateOfBirth: dateOfBirth || "",
      gender: gender || "",

      address: address || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",

      panNumber: cleanPan,
      aadhaarNumber: cleanAadhaar,

      nomineeName:
        nomineeName || "",

      nomineeRelationship:
        nomineeRelationship || "",

      nomineePhone:
        cleanNomineePhone,

      /*
        Store ONLY hashed PIN.
      */
      transactionPinHash,
    });

    /* -----------------------------------------------------
       INITIAL DEPOSIT TRANSACTION
    ----------------------------------------------------- */

    if (deposit > 0) {
      const referenceNumber =
        `DEP-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      await Transaction.create({
        user: req.user.id,
        account: account._id,

        type: "income",
        transactionKind: "INCOME",

        category: "Initial Deposit",

        amount: deposit,

        transferMethod: null,

        description:
          "Initial account deposit",

        status: "SUCCESS",

        referenceNumber,

        date: new Date(),
      });
    }

    /* -----------------------------------------------------
       POPULATE RESPONSE
    ----------------------------------------------------- */

    const populatedAccount =
      await Account.findById(
        account._id
      ).populate(
        "bank",
        "bankId bankName shortName ifscPrefix status"
      );

    res.status(201).json({
      message:
        "Account created successfully.",

      account: populatedAccount,
    });
  } catch (error) {
    /*
      Handle duplicate account number.
    */
    if (error?.code === 11000) {
      return res.status(400).json({
        message:
          "A duplicate account record was detected. Please try again.",
      });
    }

    next(error);
  }
});

/* =========================================================
   UPDATE ACCOUNT STATUS
   PUT /api/accounts/:id/status
========================================================= */

router.put("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid account status.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid account ID.",
      });
    }

    const account =
      await Account.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        {
          status,
        },
        {
          new: true,
        }
      ).populate(
        "bank",
        "bankId bankName shortName ifscPrefix status"
      );

    if (!account) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    res.json({
      message:
        "Account status updated successfully.",

      account,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREDIT ACCOUNT
   POST /api/accounts/:id/credit
========================================================= */

router.post(
  "/:id/credit",
  async (req, res, next) => {
    try {
      const {
        amount,
        description,
        category,
      } = req.body;

      const creditAmount =
        Number(amount);

      if (
        !Number.isFinite(
          creditAmount
        ) ||
        creditAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid credit amount.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid account ID.",
        });
      }

      const account =
        await Account.findOne({
          _id: req.params.id,
          user: req.user.id,
        });

      if (!account) {
        return res.status(404).json({
          message:
            "Account not found.",
        });
      }

      if (account.status !== "active") {
        return res.status(400).json({
          message:
            "Account is not active.",
        });
      }

      account.balance +=
        creditAmount;

      await account.save();

      const referenceNumber =
        `CR-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      const transaction =
        await Transaction.create({
          user: req.user.id,
          account: account._id,

          type: "income",
          transactionKind: "INCOME",

          category:
            category || "Credit",

          amount: creditAmount,

          transferMethod: null,

          description:
            description ||
            "Amount credited to account",

          status: "SUCCESS",

          referenceNumber,

          date: new Date(),
        });

      /*
        Fraud detection.
      */
      try {
        await evaluateTransactionForFraud({
          userId: req.user.id,
          accountId: account._id,
          transactionId:
            transaction._id,
          amount: creditAmount,
          type: "income",
        });
      } catch (fraudError) {
        console.error(
          "Fraud evaluation error:",
          fraudError.message
        );
      }

      res.json({
        message:
          "Amount credited successfully.",

        account,

        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   DEBIT ACCOUNT
   POST /api/accounts/:id/debit
========================================================= */

router.post(
  "/:id/debit",
  async (req, res, next) => {
    try {
      const {
        amount,
        description,
        category,
      } = req.body;

      const debitAmount =
        Number(amount);

      if (
        !Number.isFinite(
          debitAmount
        ) ||
        debitAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid debit amount.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid account ID.",
        });
      }

      const account =
        await Account.findOne({
          _id: req.params.id,
          user: req.user.id,
        });

      if (!account) {
        return res.status(404).json({
          message:
            "Account not found.",
        });
      }

      if (account.status !== "active") {
        return res.status(400).json({
          message:
            "Account is not active.",
        });
      }

      if (
        account.balance <
        debitAmount
      ) {
        return res.status(400).json({
          message:
            "Insufficient account balance.",
        });
      }

      account.balance -=
        debitAmount;

      await account.save();

      const referenceNumber =
        `DB-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      const transaction =
        await Transaction.create({
          user: req.user.id,
          account: account._id,

          type: "expense",
          transactionKind: "EXPENSE",

          category:
            category || "Debit",

          amount: debitAmount,

          transferMethod: null,

          description:
            description ||
            "Amount debited from account",

          status: "SUCCESS",

          referenceNumber,

          date: new Date(),
        });

      /*
        Fraud detection.
      */
      try {
        await evaluateTransactionForFraud({
          userId: req.user.id,
          accountId: account._id,
          transactionId:
            transaction._id,
          amount: debitAmount,
          type: "expense",
        });
      } catch (fraudError) {
        console.error(
          "Fraud evaluation error:",
          fraudError.message
        );
      }

      res.json({
        message:
          "Amount debited successfully.",

        account,

        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;