import express from "express";

import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Loan from "../models/Loan.js";
import FraudReport from "../models/FraudReport.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// ADMIN DASHBOARD
router.get(
  "/dashboard",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const totalUsers =
        await User.countDocuments();

      const totalAccounts =
        await Account.countDocuments();

      const totalTransactions =
        await Transaction.countDocuments();

      const totalLoans =
        await Loan.countDocuments();

      const highRiskFraud =
        await FraudReport.countDocuments({
          riskLevel: "High",
        });

      res.json({
        totalUsers,
        totalAccounts,
        totalTransactions,
        totalLoans,
        highRiskFraud,
      });

    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch admin dashboard",
        error: error.message,
      });
    }
  }
);

// GET ALL USERS
router.get(
  "/users",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }
);

// UPDATE USER STATUS
router.put(
  "/users/:id/status",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { isActive } = req.body;

      const user =
        await User.findByIdAndUpdate(
          req.params.id,
          { isActive },
          { new: true }
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json({
        message:
          "User status updated successfully",
        user,
      });

    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update user",
        error: error.message,
      });
    }
  }
);

// GET ALL TRANSACTIONS
router.get(
  "/transactions",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const transactions =
        await Transaction.find()
          .populate(
            "user",
            "name email"
          )
          .populate(
            "account",
            "accountNumber"
          )
          .sort({
            createdAt: -1,
          });

      res.json(transactions);

    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch transactions",
        error: error.message,
      });
    }
  }
);

export default router;