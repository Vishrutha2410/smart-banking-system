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

// ======================================================
// ADMIN PROTECTION
// ======================================================

router.use(protect, adminOnly);

// ======================================================
// ADMIN STATS
// GET /api/admin/stats
// ======================================================

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

      User.countDocuments({
        isActive: true,
      }),

      Account.countDocuments({}),

      Account.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$balance",
            },
          },
        },
      ]),

      Transaction.countDocuments({}),

      Transfer.countDocuments({}),

      Loan.countDocuments({}),

      Loan.countDocuments({
        status: "Pending",
      }),

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

// ======================================================
// USERS
// GET /api/admin/users
// ======================================================

router.get("/users", async (req, res, next) => {
  try {
    const {
      search,
      role,
      status,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (
      role &&
      ["member", "admin"].includes(role)
    ) {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    const users = await User.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json({
      users: users.map((user) =>
        user.toSafeObject()
      ),
    });
  } catch (error) {
    next(error);
  }
});

// ======================================================
// UPDATE USER STATUS
// PUT /api/admin/users/:id/status
// ======================================================

router.put(
  "/users/:id/status",
  async (req, res, next) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message:
            "isActive must be true or false",
        });
      }

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid user id",
        });
      }

      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (
        String(user._id) ===
        String(req.user._id)
      ) {
        return res.status(400).json({
          message:
            "You cannot change your own account status",
        });
      }

      user.isActive = isActive;

      await user.save();

      await notify(
        user._id,
        "Account Status Changed",
        `Your account has been ${
          isActive
            ? "activated"
            : "deactivated"
        } by an administrator.`,
        "account"
      );

      res.status(200).json({
        user: user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// ACCOUNTS
// ======================================================
//
// IMPORTANT:
//
// Instead of grouping accounts by type, this endpoint
// returns accounts grouped by ACCOUNT HOLDER.
//
// Example:
//
// {
//   user: {
//      name: "John",
//      email: "..."
//   },
//   accountCount: 3,
//   accounts: [
//      {...},
//      {...},
//      {...}
//   ]
// }
//
// ======================================================

// GET /api/admin/accounts

router.get(
  "/accounts",
  async (req, res, next) => {
    try {
      const accounts =
        await Account.find({})
          .sort({
            createdAt: -1,
          })
          .populate(
            "user",
            "name email phone address profileImage role isActive createdAt updatedAt"
          )
          .populate(
            "bank",
            "name bankName shortName code ifscPrefix"
          )
          .lean();

      // --------------------------------------------------
      // GROUP ACCOUNTS BY USER
      // --------------------------------------------------

      const groupedUsers = new Map();

      for (const account of accounts) {
        if (!account.user) {
          continue;
        }

        const userId =
          String(account.user._id);

        if (!groupedUsers.has(userId)) {
          groupedUsers.set(userId, {
            user: account.user,

            accountCount: 0,

            accounts: [],
          });
        }

        const group =
          groupedUsers.get(userId);

        group.accountCount += 1;

        group.accounts.push(account);
      }

      const groupedAccounts =
        Array.from(
          groupedUsers.values()
        );

      res.status(200).json({
        accounts: groupedAccounts,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// SINGLE USER ACCOUNT DETAILS
// GET /api/admin/accounts/user/:userId
// ======================================================

router.get(
  "/accounts/user/:userId",
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (
        !mongoose.isValidObjectId(userId)
      ) {
        return res.status(400).json({
          message: "Invalid user id",
        });
      }

      const user =
        await User.findById(userId)
          .select(
            "-password -transactionPin"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const accounts =
        await Account.find({
          user: userId,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "bank",
            "name bankName shortName code ifscPrefix"
          )
          .lean();

      res.status(200).json({
        user,
        accountCount: accounts.length,
        accounts,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// SINGLE ACCOUNT DETAILS
// GET /api/admin/accounts/:accountId
// ======================================================

router.get(
  "/accounts/:accountId",
  async (req, res, next) => {
    try {
      const { accountId } = req.params;

      if (
        !mongoose.isValidObjectId(
          accountId
        )
      ) {
        return res.status(400).json({
          message: "Invalid account id",
        });
      }

      const account =
        await Account.findById(accountId)
          .populate(
            "user",
            "name email phone address profileImage role isActive createdAt updatedAt"
          )
          .populate(
            "bank",
            "name bankName shortName code ifscPrefix"
          )
          .lean();

      if (!account) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      res.status(200).json({
        account,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// TRANSACTIONS
// GET /api/admin/transactions
// ======================================================

// GET /api/admin/transactions
router.get("/transactions", async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(
      Math.max(parseInt(limit, 10) || 100, 1),
      500
    );

    const [transactions, total] = await Promise.all([
      Transaction.find({})
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate(
          "user",
          "name email phone address profileImage role isActive createdAt updatedAt"
        )
        .populate(
          "account",
          "accountNumber accountType balance currency ifsc upiId fullName email mobileNumber dateOfBirth gender address city state pincode panNumber aadhaarNumber nomineeName nomineeRelationship nomineePhone status createdAt updatedAt"
        ),
      Transaction.countDocuments({}),
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

// ======================================================
// TRANSFERS
// GET /api/admin/transfers
// ======================================================

router.get(
  "/transfers",
  async (req, res, next) => {
    try {
      const transfers =
        await Transfer.find({})
          .sort({
            createdAt: -1,
          })
          .populate(
            "sender",
            "name email"
          )
          .populate(
            "recipient",
            "name email"
          );

      res.status(200).json({
        transfers,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// LOANS
// GET /api/admin/loans
// ======================================================

router.get(
  "/loans",
  async (req, res, next) => {
    try {
      const { status } =
        req.query;

      const query = {};

      if (status) {
        query.status = status;
      }

      const loans =
        await Loan.find(query)
          .sort({
            createdAt: -1,
          })
          .populate(
            "user",
            "name email"
          );

      res.status(200).json({
        loans,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// UPDATE LOAN STATUS
// PUT /api/admin/loans/:id/status
// ======================================================

router.put(
  "/loans/:id/status",
  async (req, res, next) => {
    try {
      const { status } =
        req.body;

      const ALLOWED = [
        "Pending",
        "Approved",
        "Rejected",
        "Active",
        "Completed",
      ];

      if (!ALLOWED.includes(status)) {
        return res.status(400).json({
          message: `status must be one of: ${ALLOWED.join(
            ", "
          )}`,
        });
      }

      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid loan id",
        });
      }

      const loan =
        await Loan.findById(
          req.params.id
        );

      if (!loan) {
        return res.status(404).json({
          message: "Loan not found",
        });
      }

      loan.status = status;

      await loan.save();

      await notify(
        loan.user,
        "Loan Status Updated",
        `Your ${loan.loanType} application status is now: ${status}.`,
        "loan"
      );

      res.status(200).json({
        loan,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// FRAUD ALERTS
// GET /api/admin/fraud
// ======================================================

router.get(
  "/fraud",
  async (req, res, next) => {
    try {
      const alerts =
        await FraudAlert.find({})
          .sort({
            createdAt: -1,
          })
          .populate(
            "user",
            "name email"
          )
          .populate(
            "transaction",
            "referenceNumber amount type date"
          );

      res.status(200).json({
        alerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// EXPORT
// ======================================================

export default router;