import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

const ALLOWED_TYPES = ["income", "expense", "transfer"];

// @route  GET /api/transactions
// Query params: page, limit, type, category, search, startDate, endDate, sort
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      search,
      startDate,
      endDate,
      sort = "-date",
    } = req.query;

    const query = { user: req.user._id };

    if (type && ALLOWED_TYPES.includes(type)) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route  GET /api/transactions/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/transactions
// Manual income/expense entry (not for transfers, which are created via /api/transfers)
router.post("/", async (req, res, next) => {
  try {
    const { accountId, type, category, amount, description, date } = req.body;

    if (!accountId || !mongoose.isValidObjectId(accountId)) {
      return res.status(400).json({ message: "Valid accountId is required" });
    }
    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "type must be 'income' or 'expense'" });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (account.status !== "active") {
      return res.status(400).json({ message: "Cannot post a transaction to an inactive account" });
    }

    if (type === "expense") {
      if (account.balance < numericAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      account.balance -= numericAmount;
    } else {
      account.balance += numericAmount;
    }

    await account.save();

    const transaction = await Transaction.create({
      user: req.user._id,
      account: account._id,
      type,
      category: category || "General",
      amount: numericAmount,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      status: "completed",
      referenceNumber: Transaction.generateReference(),
    });

    res.status(201).json({ transaction, account });
  } catch (error) {
    next(error);
  }
});

export default router;