import express from "express";
import mongoose from "mongoose";

import Loan from "../models/Loan.js";
import LoanHistory from "../models/LoanHistory.js";
import LoanRepayment from "../models/LoanRepayment.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { notify } from "../services/notificationService.js";

import {
  ensureRepaymentSchedule,
  syncRepaymentStatuses,
  syncLoanRepaymentSummary,
} from "../services/loanRepaymentService.js";

const router = express.Router();

router.use(
  protect,
  adminOnly
);

// ======================================================
// GET ALL LOANS
// GET /api/admin/loan-management
// ======================================================

router.get(
  "/",
  async (req, res, next) => {
    try {
      const {
        status,
        loanType,
        search,
      } = req.query;

      const query = {};

      if (status) {
        query.status =
          String(status)
            .trim()
            .toUpperCase();
      }

      if (loanType) {
        query.loanType =
          String(
            loanType
          ).trim();
      }

      const loans =
        await Loan.find(query)
          .sort({
            createdAt: -1,
          })
          .populate(
            "user",
            "name email phone customerType role isActive"
          )
          .populate(
            "account",
            "accountNumber accountType balance currency status"
          )
          .populate(
            "admin",
            "name email"
          );

      let filteredLoans =
        loans;

      if (search) {
        const value =
          String(search)
            .trim()
            .toLowerCase();

        filteredLoans =
          loans.filter(
            (loan) =>
              String(
                loan.loanId || ""
              )
                .toLowerCase()
                .includes(value) ||
              String(
                loan.user?.name ||
                  ""
              )
                .toLowerCase()
                .includes(value) ||
              String(
                loan.user?.email ||
                  ""
              )
                .toLowerCase()
                .includes(value)
          );
      }

      for (const loan of filteredLoans) {
        if (loan.disbursedDate) {
          await ensureRepaymentSchedule(
            loan
          );

          await syncLoanRepaymentSummary(
            loan
          );
        }
      }

      res.json({
        loans:
          filteredLoans,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// GET SINGLE LOAN
// GET /api/admin/loan-management/:id
// ======================================================

router.get(
  "/:id",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid loan ID.",
        });
      }

      const loan =
        await Loan.findById(
          req.params.id
        )
          .populate(
            "user",
            "name email phone address customerType role isActive createdAt"
          )
          .populate(
            "account",
            "accountNumber accountType balance currency status ifsc upiId"
          )
          .populate(
            "admin",
            "name email"
          );

      if (!loan) {
        return res.status(404).json({
          message:
            "Loan not found.",
        });
      }

      if (loan.disbursedDate) {
        await ensureRepaymentSchedule(
          loan
        );

        await syncLoanRepaymentSummary(
          loan
        );
      }

      const repayments =
        await LoanRepayment.find({
          loan: loan._id,
        })
          .sort({
            installmentNumber: 1,
          })
          .populate(
            "transaction",
            "transactionId referenceNumber amount date status"
          );

      const history =
        await LoanHistory.find({
          loan: loan._id,
        })
          .populate(
            "performedBy",
            "name email"
          )
          .sort({
            createdAt: 1,
          });

      const updatedLoan =
        await Loan.findById(
          loan._id
        )
          .populate(
            "user",
            "name email phone address customerType role isActive createdAt"
          )
          .populate(
            "account",
            "accountNumber accountType balance currency status ifsc upiId"
          )
          .populate(
            "admin",
            "name email"
          );

      res.json({
        loan: updatedLoan,
        repayments,
        history,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// APPROVE LOAN
// PUT /api/admin/loan-management/:id/approve
// ======================================================

router.put(
  "/:id/approve",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid loan ID.",
        });
      }

      const {
        approvedAmount,
        comment,
      } = req.body;

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
        loan.status !==
        "PENDING"
      ) {
        return res.status(400).json({
          message:
            `This loan cannot be approved because its current status is ${loan.status}.`,
        });
      }

      const requested =
        Number(
          loan.requestedAmount
        );

      const eligible =
        Number(
          loan.eligibleLimit
        );

      const amount =
        approvedAmount ===
        undefined
          ? requested
          : Number(
              approvedAmount
            );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return res.status(400).json({
          message:
            "Approved amount must be greater than zero.",
        });
      }

      if (
        amount > requested
      ) {
        return res.status(400).json({
          message:
            "Approved amount cannot exceed the requested amount.",
        });
      }

      if (
        amount > eligible
      ) {
        return res.status(400).json({
          message:
            "Approved amount cannot exceed the customer's eligible limit.",
          eligibleLimit:
            eligible,
        });
      }

      loan.status =
        "APPROVED";

      loan.admin =
        req.user._id;

      loan.approvedAmount =
        amount;

      loan.adminComment =
        String(
          comment || ""
        ).trim();

      loan.rejectionReason =
        "";

      await loan.save();

      await LoanHistory.create({
        loan: loan._id,
        action:
          "Loan Approved",
        oldStatus:
          "PENDING",
        newStatus:
          "APPROVED",
        performedBy:
          req.user._id,
        comment:
          loan.adminComment ||
          `Loan approved for ₹${amount.toLocaleString(
            "en-IN"
          )}.`,
      });

      await notify(
        loan.user,
        "Loan Approved",
        `Your ${loan.loanType} application ${loan.loanId} has been approved for ₹${amount.toLocaleString(
          "en-IN"
        )}.`,
        "loan"
      );

      const updatedLoan =
        await Loan.findById(
          loan._id
        )
          .populate(
            "user",
            "name email phone customerType"
          )
          .populate(
            "account",
            "accountNumber accountType balance currency status"
          )
          .populate(
            "admin",
            "name email"
          );

      res.json({
        message:
          "Loan approved successfully. It is ready for disbursement.",
        loan: updatedLoan,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// REJECT LOAN
// PUT /api/admin/loan-management/:id/reject
// ======================================================

router.put(
  "/:id/reject",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid loan ID.",
        });
      }

      const {
        reason,
      } = req.body;

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
        loan.status !==
        "PENDING"
      ) {
        return res.status(400).json({
          message:
            `This loan cannot be rejected because its current status is ${loan.status}.`,
        });
      }

      const rejectionReason =
        String(
          reason || ""
        ).trim();

      if (
        !rejectionReason
      ) {
        return res.status(400).json({
          message:
            "Please provide a rejection reason.",
        });
      }

      loan.status =
        "REJECTED";

      loan.admin =
        req.user._id;

      loan.approvedAmount =
        0;

      loan.rejectionReason =
        rejectionReason;

      loan.adminComment =
        rejectionReason;

      await loan.save();

      await LoanHistory.create({
        loan: loan._id,
        action:
          "Loan Rejected",
        oldStatus:
          "PENDING",
        newStatus:
          "REJECTED",
        performedBy:
          req.user._id,
        comment:
          rejectionReason,
      });

      await notify(
        loan.user,
        "Loan Rejected",
        `Your ${loan.loanType} application ${loan.loanId} was rejected. Reason: ${rejectionReason}`,
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

// ======================================================
// DISBURSE LOAN
// PUT /api/admin/loan-management/:id/disburse
// ======================================================

router.put(
  "/:id/disburse",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid loan ID.",
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
        loan.status !==
        "APPROVED"
      ) {
        return res.status(400).json({
          message:
            `Only approved loans can be disbursed. Current status: ${loan.status}.`,
        });
      }

      const amount =
        Number(
          loan.approvedAmount ||
            loan.requestedAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid approved amount.",
        });
      }

      const account =
        await Account.findOne({
          _id: loan.account,
          user: loan.user,
          status: "active",
        });

      if (!account) {
        return res.status(404).json({
          message:
            "The loan account is not active.",
        });
      }

      const previousBalance =
        Number(
          account.balance || 0
        );

      const disbursementDate =
        new Date();

      // ---------------------------------------------
      // Credit customer account
      // ---------------------------------------------

      account.balance =
        previousBalance +
        amount;

      await account.save();

      let transaction = null;

      try {
        transaction =
          await Transaction.create(
            {
              user:
                loan.user,

              account:
                account._id,

              type: "income",

              transactionKind:
                "INCOME",

              amount,

              category:
                "Loan Disbursement",

              description:
                `${loan.loanType} disbursement - ${loan.loanId}`,

              transferMethod:
                null,

              status:
                "SUCCESS",

              referenceNumber:
                Transaction.generateReference(),

              transactionId:
                Transaction.generateTransactionId(),

              date:
                disbursementDate,
            }
          );

        loan.status =
          "ACTIVE";

        loan.admin =
          req.user._id;

        loan.disbursedAmount =
          amount;

        loan.disbursedDate =
          disbursementDate;

        loan.repaymentStartDate =
          new Date(
            disbursementDate
          );

        loan.totalRepaymentAmount =
          Number(
            loan.monthlyPayment
          ) *
          Number(
            loan.tenureMonths
          );

        loan.totalPaidAmount =
          0;

        loan.remainingAmount =
          loan.totalRepaymentAmount;

        loan.paidInstallments =
          0;

        loan.lastPaymentDate =
          null;

        loan.overdueAmount =
          0;

        await loan.save();

        await ensureRepaymentSchedule(
          loan
        );

        const schedule =
          await LoanRepayment.find({
            loan: loan._id,
          }).sort({
            installmentNumber: 1,
          });

        loan.nextDueDate =
          schedule[0]
            ?.dueDate ||
          null;

        await loan.save();

        await LoanHistory.create({
          loan: loan._id,
          action:
            "Loan Disbursed",
          oldStatus:
            "APPROVED",
          newStatus:
            "ACTIVE",
          performedBy:
            req.user._id,
          comment:
            `₹${amount.toLocaleString(
              "en-IN"
            )} disbursed to account ${account.accountNumber}.`,
        });

        await notify(
          loan.user,
          "Loan Disbursed",
          `₹${amount.toLocaleString(
            "en-IN"
          )} has been disbursed to your account for loan ${loan.loanId}. Your first EMI is due on ${loan.nextDueDate?.toLocaleDateString(
            "en-IN"
          )}.`,
          "loan"
        );

        const updatedLoan =
          await Loan.findById(
            loan._id
          )
            .populate(
              "account",
              "accountNumber accountType balance currency status"
            )
            .populate(
              "admin",
              "name email"
            );

        res.json({
          message:
            "Loan disbursed successfully.",
          loan:
            updatedLoan,
          transaction,
        });
      } catch (disbursementError) {
        // Roll back account balance
        await Account.findByIdAndUpdate(
          account._id,
          {
            $set: {
              balance:
                previousBalance,
            },
          }
        );

        if (transaction?._id) {
          await Transaction.findByIdAndDelete(
            transaction._id
          );
        }

        throw disbursementError;
      }
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// GET REPAYMENT HISTORY FOR ADMIN
// GET /api/admin/loan-management/:id/repayments
// ======================================================

router.get(
  "/:id/repayments",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid loan ID.",
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

      if (loan.disbursedDate) {
        await ensureRepaymentSchedule(
          loan
        );

        await syncLoanRepaymentSummary(
          loan
        );
      }

      const repayments =
        await LoanRepayment.find({
          loan: loan._id,
        })
          .sort({
            installmentNumber: 1,
          })
          .populate(
            "transaction",
            "transactionId referenceNumber amount date status"
          );

      res.json({
        loan,
        repayments,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;