import express from "express";
import mongoose from "mongoose";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

/*
 * Expense categories used by the application.
 *
 * You can add more later without changing
 * the basic expense architecture.
 */
const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Groceries",
  "Subscriptions",
  "Other",
];

/*
 * Generate unique transaction reference.
 */
const generateReferenceNumber = () => {
  return `EXP${Date.now()}${Math.floor(
    1000 + Math.random() * 9000
  )}`;
};

/*
 * GET /api/expenses
 *
 * Get actual expenses belonging to
 * the logged-in user.
 */
router.get("/", async (req, res, next) => {
  try {
    const expenses = await Transaction.find({
      user: req.user._id,

      transactionKind: "EXPENSE",
    })
      .populate(
        "account",
        "accountNumber accountType balance"
      )
      .sort({
        date: -1,
      });

    res.status(200).json({
      expenses,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * POST /api/expenses
 *
 * Create an actual expense.
 *
 * Body:
 *
 * {
 *   accountId,
 *   category,
 *   amount,
 *   description,
 *   date
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      accountId,
      category,
      amount,
      description,
      date,
    } = req.body;

    /*
     * Validate account ID.
     */
    if (
      !accountId ||
      !mongoose.isValidObjectId(accountId)
    ) {
      return res.status(400).json({
        message:
          "A valid account is required.",
      });
    }

    /*
     * Validate category.
     */
    if (
      !category ||
      !String(category).trim()
    ) {
      return res.status(400).json({
        message:
          "Expense category is required.",
      });
    }

    const normalizedCategory =
      String(category).trim();

    /*
     * Only allow known categories.
     */
    if (
      !EXPENSE_CATEGORIES.some(
        (item) =>
          item.toLowerCase() ===
          normalizedCategory.toLowerCase()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid expense category.",
      });
    }

    /*
     * Validate amount.
     */
    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Amount must be greater than zero.",
      });
    }

    /*
     * Find only the user's account.
     */
    const account =
      await Account.findOne({
        _id: accountId,
        user: req.user._id,
      });

    if (!account) {
      return res.status(404).json({
        message:
          "Account not found.",
      });
    }

    /*
     * Account must be active.
     */
    if (
      String(account.status).toLowerCase() !==
      "active"
    ) {
      return res.status(400).json({
        message:
          "Only active accounts can be used for expenses.",
      });
    }

    /*
     * Check balance.
     */
    if (
      Number(account.balance) <
      numericAmount
    ) {
      return res.status(400).json({
        message:
          "Insufficient account balance.",
      });
    }

    /*
     * Normalize category so:
     *
     * food
     * Food
     * FOOD
     *
     * all become:
     *
     * Food
     */
    const finalCategory =
      EXPENSE_CATEGORIES.find(
        (item) =>
          item.toLowerCase() ===
          normalizedCategory.toLowerCase()
      ) || "Other";

    /*
     * Deduct money.
     */
    account.balance =
      Number(account.balance) -
      numericAmount;

    await account.save();

    /*
     * Create transaction.
     *
     * THIS is what makes it an actual
     * budget expense.
     */
    const transaction =
      await Transaction.create({
        transactionId:
          Transaction.generateTransactionId(),

        user:
          req.user._id,

        account:
          account._id,

        type:
          "expense",

        transactionKind:
          "EXPENSE",

        category:
          finalCategory,

        amount:
          numericAmount,

        transferMethod:
          null,

        description:
          description?.trim() ||
          finalCategory,

        status:
          "SUCCESS",

        referenceNumber:
          generateReferenceNumber(),

        date:
          date
            ? new Date(date)
            : new Date(),
      });

    const populatedTransaction =
      await Transaction.findById(
        transaction._id
      ).populate(
        "account",
        "accountNumber accountType balance"
      );

    res.status(201).json({
      message:
        "Expense recorded successfully.",

      expense:
        populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * DELETE /api/expenses/:id
 *
 * We intentionally do not provide
 * deletion here because deleting a
 * financial transaction after the
 * balance was already deducted would
 * require reversing the account balance.
 *
 * We can add a proper reversal system
 * later if needed.
 */

export default router;