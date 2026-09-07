import express from "express";

import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/summary",
  protect,
  async (req, res) => {

    try {

      const accounts =
        await Account.find({
          user: req.user._id,
        });

      const transactions =
        await Transaction.find({
          user: req.user._id,
        }).sort({
          createdAt: -1,
        });

      const totalBalance =
        accounts.reduce(
          (total, account) =>
            total + account.balance,
          0
        );

      const income =
        transactions
          .filter(
            (transaction) =>
              transaction.type === "income"
          )
          .reduce(
            (total, transaction) =>
              total + transaction.amount,
            0
          );

      const expenses =
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense"
          )
          .reduce(
            (total, transaction) =>
              total + transaction.amount,
            0
          );

      res.json({

        totalBalance,

        income,

        expenses,

        savings:
          income - expenses,

        recentTransactions:
          transactions.slice(0, 5),

      });

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to fetch dashboard",
      });

    }

  }
);

export default router;