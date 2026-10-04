import express from "express";
import mongoose from "mongoose";

import Loan from "../models/Loan.js";
import Account from "../models/Account.js";
import LoanHistory from "../models/LoanHistory.js";
import LoanRepayment from "../models/LoanRepayment.js";
import Transaction from "../models/Transaction.js";

import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

import {
  ensureRepaymentSchedule,
  syncRepaymentStatuses,
  syncLoanRepaymentSummary,
} from "../services/loanRepaymentService.js";

const router = express.Router();

router.use(protect);

// ======================================================
// LOAN TYPES
// ======================================================

const LOAN_TYPES = [
  "Personal Loan",
  "Education Loan",
  "Vehicle Loan",
  "Home Loan",
  "Emergency Loan",
  "Business Loan",
];

const STUDENT_LOAN_TYPES = [
  "Education Loan",
];

const INTEREST_RATES = {
  "Personal Loan": 12,
  "Education Loan": 8,
  "Vehicle Loan": 9,
  "Home Loan": 7,
  "Emergency Loan": 13,
  "Business Loan": 10,
};

// ======================================================
// CUSTOMER TYPE
// ======================================================

const getCustomerType = (req) =>
  String(
    req.user?.customerType ||
      "personal"
  )
    .trim()
    .toLowerCase();

const isStudentUser = (req) =>
  getCustomerType(req) ===
  "student";

const isAllowedLoanType = (
  req,
  loanType
) => {
  if (
    isStudentUser(req)
  ) {
    return (
      STUDENT_LOAN_TYPES.includes(
        loanType
      )
    );
  }

  return LOAN_TYPES.includes(
    loanType
  );
};

// ======================================================
// GET MY LOANS
// GET /api/loans/my
// ======================================================

router.get(
  "/my",
  async (req, res, next) => {
    try {
      const query = {
        user: req.user._id,
      };

      if (isStudentUser(req)) {
        query.loanType =
          "Education Loan";
      }

      const loans =
        await Loan.find(query)
          .populate(
            "account",
            "accountNumber accountType balance currency status"
          )
          .populate(
            "admin",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      for (const loan of loans) {
        if (loan.disbursedDate) {
          await ensureRepaymentSchedule(
            loan
          );

          await syncLoanRepaymentSummary(
            loan
          );
        }
      }

      const refreshedLoans =
        await Loan.find(query)
          .populate(
            "account",
            "accountNumber accountType balance currency status"
          )
          .populate(
            "admin",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        loans: refreshedLoans,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// GET SINGLE LOAN
// GET /api/loans/:id
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
        await Loan.findOne({
          _id: req.params.id,
          user: req.user._id,
        })
          .populate("account")
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

      if (
        isStudentUser(req) &&
        loan.loanType !==
          "Education Loan"
      ) {
        return res.status(403).json({
          message:
            "Students can only access Education Loans.",
        });
      }

      let repayments = [];

      if (loan.disbursedDate) {
        await ensureRepaymentSchedule(
          loan
        );

        await syncRepaymentStatuses(
          loan._id
        );

        await syncLoanRepaymentSummary(
          loan
        );

        repayments =
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
      }

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
          .populate("account")
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
// APPLY FOR LOAN
// POST /api/loans
// ======================================================

router.post(
  "/",
  async (req, res, next) => {
    try {
      const {
        loanType,
        accountId,
        requestedAmount,
        monthlyIncome,
        creditScore,
        existingLoanAmount,
        tenureMonths,
        purpose,
      } = req.body;

      if (
        !isAllowedLoanType(
          req,
          loanType
        )
      ) {
        return res.status(403).json({
          message: isStudentUser(req)
            ? "Students can apply only for an Education Loan."
            : "Invalid loan type.",
        });
      }

      if (
        !accountId ||
        !mongoose.isValidObjectId(
          accountId
        )
      ) {
        return res.status(400).json({
          message:
            "Valid account is required.",
        });
      }

      const account =
        await Account.findOne({
          _id: accountId,
          user: req.user._id,
          status: "active",
        });

      if (!account) {
        return res.status(404).json({
          message:
            "Active account not found.",
        });
      }

      const amount = Number(
        requestedAmount
      );

      const income = Number(
        monthlyIncome
      );

      const score = Number(
        creditScore
      );

      const existing = Number(
        existingLoanAmount || 0
      );

      const tenure = Number(
        tenureMonths
      );

      if (
        !Number.isFinite(amount) ||
        amount < 1000
      ) {
        return res.status(400).json({
          message:
            "Requested amount must be at least ₹1,000.",
        });
      }

      if (
        !Number.isFinite(income) ||
        income <= 0
      ) {
        return res.status(400).json({
          message:
            "Monthly income is required.",
        });
      }

      if (
        !Number.isFinite(score) ||
        score < 0
      ) {
        return res.status(400).json({
          message:
            "Credit score is required.",
        });
      }

      if (
        !Number.isFinite(tenure) ||
        tenure < 1
      ) {
        return res.status(400).json({
          message:
            "Tenure must be at least one month.",
        });
      }

      const eligibleLimit =
        Loan.calculateEligibleLimit({
          monthlyIncome:
            income,
          creditScore:
            score,
          existingLoanAmount:
            existing,
        });

      if (eligibleLimit <= 0) {
        return res.status(400).json({
          message:
            "You do not currently meet the project eligibility rules.",
          eligibleLimit: 0,
        });
      }

      if (
        amount > eligibleLimit
      ) {
        return res.status(400).json({
          message:
            `Requested amount exceeds your eligible limit of ₹${eligibleLimit.toLocaleString(
              "en-IN"
            )}.`,
          eligibleLimit,
        });
      }

      const loanId =
        await Loan.generateLoanId();

      const interestRate =
        INTEREST_RATES[
          loanType
        ] || 10;

      const monthlyPayment =
        Loan.calculateEMI(
          amount,
          interestRate,
          tenure
        );

      const loan =
        await Loan.create({
          loanId,

          user: req.user._id,

          account: account._id,

          loanType,

          requestedAmount:
            amount,

          eligibleLimit,

          monthlyIncome:
            income,

          creditScore:
            score,

          existingLoanAmount:
            existing,

          interestRate,

          tenureMonths:
            tenure,

          monthlyPayment,

          status: "PENDING",

          purpose:
            purpose || "",
        });

      await LoanHistory.create({
        loan: loan._id,

        action:
          "Loan Submitted",

        oldStatus: "",

        newStatus: "PENDING",

        performedBy:
          req.user._id,

        comment:
          "Loan application submitted.",
      });

      await notify(
        req.user._id,
        "Loan Submitted",
        `Your loan application ${loan.loanId} has been submitted successfully.`,
        "loan"
      );

      res.status(201).json({
        message:
          "Loan application submitted successfully.",
        loan,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// PAY NEXT EMI
// POST /api/loans/:id/repay
// ======================================================

router.post(
  "/:id/repay",
  async (req, res, next) => {
    try {
      const {
        paymentAccountId,
      } = req.body;

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
        await Loan.findOne({
          _id: req.params.id,
          user: req.user._id,
        });

      if (!loan) {
        return res.status(404).json({
          message:
            "Loan not found.",
        });
      }

      if (
        isStudentUser(req) &&
        loan.loanType !==
          "Education Loan"
      ) {
        return res.status(403).json({
          message:
            "Students can only repay Education Loans.",
        });
      }

      if (
        ![
          "ACTIVE",
          "REPAYMENT",
          "OVERDUE",
        ].includes(loan.status)
      ) {
        return res.status(400).json({
          message:
            "This loan is not currently available for repayment.",
        });
      }

      await ensureRepaymentSchedule(
        loan
      );

      await syncRepaymentStatuses(
        loan._id
      );

      const repayment =
        await LoanRepayment.findOne({
          loan: loan._id,
          status: {
            $ne: "PAID",
          },
        }).sort({
          installmentNumber: 1,
        });

      if (!repayment) {
        loan.status = "CLOSED";
        await loan.save();

        return res.status(400).json({
          message:
            "All loan installments have already been paid.",
        });
      }

      const amountDue =
        Math.max(
          0,
          Number(
            repayment.amountDue
          ) -
            Number(
              repayment.amountPaid ||
                0
            )
        );

      if (amountDue <= 0) {
        repayment.status =
          "PAID";

        repayment.paidAt =
          new Date();

        await repayment.save();

        return res.status(400).json({
          message:
            "This installment is already paid.",
        });
      }

      const accountId =
        paymentAccountId ||
        loan.account;

      if (
        !mongoose.isValidObjectId(
          accountId
        )
      ) {
        return res.status(400).json({
          message:
            "Valid payment account is required.",
        });
      }

      const account =
        await Account.findOne({
          _id: accountId,
          user: req.user._id,
          status: "active",
        });

      if (!account) {
        return res.status(404).json({
          message:
            "Active payment account not found.",
        });
      }

      const currentBalance =
        Number(
          account.balance || 0
        );

      if (
        currentBalance <
        amountDue
      ) {
        return res.status(400).json({
          message:
            `Insufficient balance. You need ₹${amountDue.toLocaleString(
              "en-IN"
            )} to pay this EMI.`,
          amountDue,
          availableBalance:
            currentBalance,
        });
      }

      const previousBalance =
        currentBalance;

      // ---------------------------------------------
      // Debit customer account
      // ---------------------------------------------

      account.balance =
        currentBalance -
        amountDue;

      await account.save();

      let transaction = null;

      try {
        transaction =
          await Transaction.create(
            {
              user:
                req.user._id,

              account:
                account._id,

              type: "expense",

              transactionKind:
                "EXPENSE",

              amount: amountDue,

              category:
                "Loan Repayment",

              description:
                `EMI ${repayment.installmentNumber} payment for ${loan.loanId}`,

              transferMethod:
                null,

              status:
                "SUCCESS",

              referenceNumber:
                Transaction.generateReference(),

              transactionId:
                Transaction.generateTransactionId(),

              date: new Date(),
            }
          );

        repayment.amountPaid =
          Number(
            repayment.amountPaid ||
              0
          ) + amountDue;

        repayment.paidAt =
          new Date();

        repayment.status =
          "PAID";

        repayment.transaction =
          transaction._id;

        repayment.paymentReference =
          transaction.referenceNumber;

        await repayment.save();

        loan.totalPaidAmount =
          Number(
            loan.totalPaidAmount ||
              0
          ) + amountDue;

        loan.lastPaymentDate =
          new Date();

        loan.paidInstallments =
          Number(
            loan.paidInstallments ||
              0
          ) + 1;

        await syncRepaymentStatuses(
          loan._id
        );

        const remainingRepayments =
          await LoanRepayment.find({
            loan: loan._id,
            status: {
              $ne: "PAID",
            },
          }).sort({
            installmentNumber: 1,
          });

        loan.remainingAmount =
          Math.max(
            0,
            remainingRepayments.reduce(
              (sum, item) =>
                sum +
                Math.max(
                  0,
                  Number(
                    item.amountDue
                  ) -
                    Number(
                      item.amountPaid ||
                        0
                    )
                ),
              0
            )
          );

        const overdueAmount =
          remainingRepayments
            .filter(
              (item) =>
                item.status ===
                "OVERDUE"
            )
            .reduce(
              (sum, item) =>
                sum +
                Math.max(
                  0,
                  Number(
                    item.amountDue
                  ) -
                    Number(
                      item.amountPaid ||
                        0
                    )
                ),
              0
            );

        loan.overdueAmount =
          overdueAmount;

        const nextRepayment =
          remainingRepayments[0];

        loan.nextDueDate =
          nextRepayment?.dueDate ||
          null;

        if (
          remainingRepayments.length ===
          0
        ) {
          loan.status =
            "CLOSED";

          loan.remainingAmount =
            0;
        } else if (
          overdueAmount > 0
        ) {
          loan.status =
            "OVERDUE";
        } else {
          loan.status =
            "REPAYMENT";
        }

        await loan.save();

        await LoanHistory.create({
          loan: loan._id,

          action:
            "EMI Paid",

          oldStatus:
            "REPAYMENT",

          newStatus:
            loan.status,

          performedBy:
            req.user._id,

          comment:
            `Installment ${repayment.installmentNumber} paid successfully. Amount: ₹${amountDue.toLocaleString(
              "en-IN"
            )}.`,
        });

        await notify(
          req.user._id,
          "Loan EMI Paid",
          `Your EMI ${repayment.installmentNumber} for loan ${loan.loanId} has been paid successfully.`,
          "loan"
        );

        const updatedLoan =
          await Loan.findById(
            loan._id
          ).populate(
            "account"
          );

        const schedule =
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

        return res.status(200).json({
          message:
            "Loan EMI paid successfully.",
          loan: updatedLoan,
          repayment,
          transaction,
          repayments: schedule,
        });
      } catch (paymentError) {
        // Roll back the account balance
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

        throw paymentError;
      }
    } catch (error) {
      next(error);
    }
  }
);

// ======================================================
// GET REPAYMENT SCHEDULE
// GET /api/loans/:id/repayments
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
        await Loan.findOne({
          _id: req.params.id,
          user: req.user._id,
        });

      if (!loan) {
        return res.status(404).json({
          message:
            "Loan not found.",
        });
      }

      if (
        loan.disbursedDate
      ) {
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