import express from "express";
import FraudReport from "../models/FraudReport.js";
import Transaction from "../models/Transaction.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET FRAUD REPORTS
router.get("/", protect, async (req, res) => {
  try {
    const reports = await FraudReport.find({
      user: req.user._id,
    })
      .populate("transaction")
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch fraud reports",
      error: error.message,
    });
  }
});

// ANALYZE TRANSACTION
router.post("/analyze", protect, async (req, res) => {
  try {
    const {
      transactionId,
      amount,
      location,
    } = req.body;

    let fraudScore = 10;
    let riskLevel = "Low";
    let reason = "Normal transaction pattern";

    let transaction = null;

    if (transactionId) {
      transaction = await Transaction.findOne({
        _id: transactionId,
        user: req.user._id,
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }
    }

    const transactionAmount =
      Number(amount || transaction?.amount || 0);

    if (transactionAmount > 50000) {
      fraudScore = 60;
      riskLevel = "Medium";
      reason = "High transaction amount detected";
    }

    if (transactionAmount > 100000) {
      fraudScore = 90;
      riskLevel = "High";
      reason = "Very high transaction amount detected";
    }

    if (!location) {
      fraudScore = Math.min(
        fraudScore + 10,
        100
      );
    }

    const status =
      riskLevel === "High"
        ? "Under Review"
        : "Safe";

    const report = await FraudReport.create({
      user: req.user._id,
      transaction: transaction
        ? transaction._id
        : null,
      fraudScore,
      riskLevel,
      reason,
      status,
    });

    res.json({
      message: "Fraud analysis completed",
      report,
    });

  } catch (error) {
    res.status(500).json({
      message: "Fraud analysis failed",
      error: error.message,
    });
  }
});

export default router;