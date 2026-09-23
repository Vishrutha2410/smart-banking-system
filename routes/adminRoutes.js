import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Transfer from "../models/Transfer.js";
import Loan from "../models/Loan.js";
import FraudAlert from "../models/FraudAlert.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, adminOnly);

// @route GET /api/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAccounts,
      depositAgg,
      totalTransactions,
      totalTransfers,
      totalLoans,
      pendingLoans,
      fraudAlerts,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Account.countDocuments({}),
      Account.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
      Transaction.countDocuments({}),
      Transfer.countDocuments({}),
      Loan.countDocuments({}),
      Loan.countDocuments({ status: "Pending" }),
      FraudAlert.countDocuments({}),
    ]);

    res.status(200).json({
      totalUsers,
      activeUsers,
      totalAccounts,
      totalDeposits: depositAgg[0]?.total || 0,
      totalTransactions,
      totalTransfers,
      totalLoans,
      pendingLoans,
      fraudAlerts,
    });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/users?search=&role=&status=
router.get("/users", async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["member", "admin"].includes(role)) query.role = role;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ users: users.map((u) => u.toSafeObject()) });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/admin/users/:id/status
// body: { isActive: boolean }
router.put("/users/:id/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own account status" });
    }

    user.isActive = isActive;
    await user.save();

    await notify(
      user._id,
      "Account Status Changed",
      `Your account has been ${isActive ? "activated" : "deactivated"} by an administrator.`,
      "account"
    );

    res.status(200).json({ user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/accounts
router.get("/accounts", async (req, res, next) => {
  try {
    const accounts = await Account.find({}).sort({ createdAt: -1 }).populate("user", "name email");
    res.status(200).json({ accounts });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/transactions
router.get("/transactions", async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [transactions, total] = await Promise.all([
      Transaction.find({})
        .sort({ date: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("user", "name email"),
      Transaction.countDocuments({}),
    ]);

    res.status(200).json({
      transactions,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/transfers
router.get("/transfers", async (req, res, next) => {
  try {
    const transfers = await Transfer.find({})
      .sort({ createdAt: -1 })
      .populate("sender", "name email")
      .populate("recipient", "name email");
    res.status(200).json({ transfers });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/loans
router.get("/loans", async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const loans = await Loan.find(query).sort({ createdAt: -1 }).populate("user", "name email");
    res.status(200).json({ loans });
  } catch (error) {
    next(error);
  }
});

// @route PUT /api/admin/loans/:id/status
// body: { status: "Approved" | "Rejected" | "Active" | "Completed" }
router.put("/loans/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const ALLOWED = ["Pending", "Approved", "Rejected", "Active", "Completed"];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ALLOWED.join(", ")}` });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid loan id" });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    loan.status = status;
    await loan.save();

    await notify(
      loan.user,
      "Loan Status Updated",
      `Your ${loan.loanType} application status is now: ${status}.`,
      "loan"
    );

    res.status(200).json({ loan });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/admin/fraud
router.get("/fraud", async (req, res, next) => {
  try {
    const alerts = await FraudAlert.find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("transaction", "referenceNumber amount type date");
    res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/loans/:id/approve",
  async (req, res, next) => {
    try {
      const {
        approvedAmount,
        interestRate,
        tenureMonths,
        adminComment,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid loan ID.",
        });
      }

      const loan = await Loan.findById(
        req.params.id
      );

      if (!loan) {
        return res.status(404).json({
          message: "Loan not found.",
        });
      }

      if (
        !["PENDING", "UNDER_REVIEW"].includes(
          loan.status
        )
      ) {
        return res.status(400).json({
          message:
            "This loan cannot be approved in its current state.",
        });
      }

      const finalAmount =
        Number(approvedAmount);

      if (
        !finalAmount ||
        finalAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Approved amount must be greater than zero.",
        });
      }

      if (
        finalAmount >
        loan.eligibleLimit
      ) {
        return res.status(400).json({
          message:
            "Approved amount cannot exceed the eligible limit.",
        });
      }

      const oldStatus = loan.status;

      loan.status = "APPROVED";
      loan.approvedAmount =
        finalAmount;
      loan.interestRate =
        Number(interestRate);
      loan.tenureMonths =
        Number(tenureMonths);
      loan.admin =
        req.user._id;
      loan.adminComment =
        adminComment || "";

      loan.monthlyPayment =
        Loan.calculateEMI(
          finalAmount,
          loan.interestRate,
          loan.tenureMonths
        );

      await loan.save();

      await LoanHistory.create({
        loan: loan._id,
        action: "Loan Approved",
        oldStatus,
        newStatus: "APPROVED",
        performedBy: req.user._id,
        comment:
          adminComment || "Loan approved.",
      });

      await notify(
        loan.user,
        "Loan Approved",
        `Your loan application ${loan.loanId} has been approved.`,
        "loan"
      );

      res.json({
        message:
          "Loan approved successfully.",
        loan,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/loans/:id/reject",
  async (req, res, next) => {
    try {
      const {
        reason,
      } = req.body;

      if (!reason?.trim()) {
        return res.status(400).json({
          message:
            "Rejection reason is required.",
        });
      }

      const loan =
        await Loan.findById(
          req.params.id
        );

      if (!loan) {
        return res.status(404).json({
          message:
            "Loan not found.",
        });
      }

      if (
        ["APPROVED", "REJECTED", "CLOSED"].includes(
          loan.status
        )
      ) {
        return res.status(400).json({
          message:
            "Loan cannot be rejected in its current state.",
        });
      }

      const oldStatus =
        loan.status;

      loan.status =
        "REJECTED";

      loan.admin =
        req.user._id;

      loan.adminComment =
        reason;

      loan.rejectionReason =
        reason;

      await loan.save();

      await LoanHistory.create({
        loan: loan._id,
        action:
          "Loan Rejected",
        oldStatus,
        newStatus:
          "REJECTED",
        performedBy:
          req.user._id,
        comment: reason,
      });

      await notify(
        loan.user,
        "Loan Rejected",
        `Your loan application ${loan.loanId} has been rejected. Reason: ${reason}`,
        "loan"
      );

      res.json({
        message:
          "Loan rejected successfully.",
        loan,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/loans/:id/documents-required",
  async (req, res, next) => {
    try {
      const { comment } =
        req.body;

      const loan =
        await Loan.findById(
          req.params.id
        );

      if (!loan) {
        return res.status(404).json({
          message:
            "Loan not found.",
        });
      }

      const oldStatus =
        loan.status;

      loan.status =
        "DOCUMENTS_REQUIRED";

      loan.admin =
        req.user._id;

      loan.adminComment =
        comment || "Additional documents required.";

      await loan.save();

      await LoanHistory.create({
        loan: loan._id,
        action:
          "Documents Requested",
        oldStatus,
        newStatus:
          "DOCUMENTS_REQUIRED",
        performedBy:
          req.user._id,
        comment:
          loan.adminComment,
      });

      await notify(
        loan.user,
        "Documents Required",
        `Additional documents are required for loan ${loan.loanId}.`,
        "loan"
      );

      res.json({
        message:
          "Loan marked as requiring documents.",
        loan,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/loans/:id/history",
  async (req, res, next) => {
    try {
      const history =
        await LoanHistory.find({
          loan: req.params.id,
        })
          .populate(
            "performedBy",
            "name email"
          )
          .sort({
            createdAt: 1,
          });

      res.json({
        history,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
