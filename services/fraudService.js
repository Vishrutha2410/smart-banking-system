import Transaction from "../models/Transaction.js";
import FraudAlert from "../models/FraudAlert.js";

// Basic, explainable rule-based fraud detection.
// This is intentionally NOT marketed as an advanced AI model unless one is
// actually wired up - it is a set of static thresholds.
const LARGE_TRANSACTION_THRESHOLD = 100000;
const RAPID_TRANSACTION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RAPID_TRANSACTION_COUNT = 3;
const HIGH_DAILY_SPEND_THRESHOLD = 200000;

/**
 * Runs fraud rules for a user after a new transaction is created.
 * Call this AFTER the transaction is committed - it only reads, never writes
 * balances, so it's safe to run outside the money-movement DB session.
 */
export const evaluateTransactionForFraud = async ({ userId, transaction }) => {
  const alerts = [];

  // Rule 1: unusually large single transaction
  if (transaction.amount >= LARGE_TRANSACTION_THRESHOLD) {
    alerts.push({
      user: userId,
      transaction: transaction._id,
      type: "large_transaction",
      severity: transaction.amount >= LARGE_TRANSACTION_THRESHOLD * 2 ? "Critical" : "High",
      message: `Unusually large ${transaction.type} of ₹${transaction.amount.toLocaleString(
        "en-IN"
      )} was recorded.`,
    });
  }

  // Rule 2: multiple rapid transactions in a short window
  const windowStart = new Date(Date.now() - RAPID_TRANSACTION_WINDOW_MS);
  const recentCount = await Transaction.countDocuments({
    user: userId,
    createdAt: { $gte: windowStart },
  });
  if (recentCount >= RAPID_TRANSACTION_COUNT) {
    alerts.push({
      user: userId,
      transaction: transaction._id,
      type: "rapid_transactions",
      severity: "Medium",
      message: `${recentCount} transactions were recorded within the last 5 minutes.`,
    });
  }

  // Rule 3: high total spend today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysExpenses = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: { $in: ["expense", "transfer"] },
        date: { $gte: startOfToday },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const todaysTotal = todaysExpenses[0]?.total || 0;
  if (todaysTotal >= HIGH_DAILY_SPEND_THRESHOLD) {
    alerts.push({
      user: userId,
      transaction: transaction._id,
      type: "high_daily_spend",
      severity: "High",
      message: `Total outgoing amount today (₹${todaysTotal.toLocaleString(
        "en-IN"
      )}) exceeds the normal daily threshold.`,
    });
  }

  if (alerts.length > 0) {
    await FraudAlert.insertMany(alerts);
  }

  return alerts;
};
