import express from "express";
import mongoose from "mongoose";

import Loan from "../models/Loan.js";
import Account from "../models/Account.js";
import LoanHistory from "../models/LoanHistory.js";

import { protect } from "../middleware/authMiddleware.js";
import { notify } from "../services/notificationService.js";

const router = express.Router();

router.use(protect);

const LOAN_TYPES = [
  "Personal Loan",
  "Education Loan",
  "Vehicle Loan",
  "Home Loan",
  "Emergency Loan",
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
};

const getCustomerType = (req) => {
  return String(
    req.user?.customerType ||
      "personal"
  )
    .trim()
    .toLowerCase();
};

const isStudentUser = (req) => {
  return (
    getCustomerType(req) ===
    "student"
  );
};

const isAllowedLoanType = (
  req,
  loanType
) => {
  if (!LOAN_TYPES.includes(loanType)) {
    return false;
  }

  if (
    isStudentUser(req) &&
    !STUDENT_LOAN_TYPES.includes(
      loanType
    )
  ) {
    return false;
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| GET MY LOANS
|--------------------------------------------------------------------------
*/

router.get("/my", async (req, res, next) => {
  try {
    const query = {
      user: req.user._id,
    };

    /*
     * Student customers should only see
     * Education Loan applications in their
     * student banking flow.
     */
    if (isStudentUser(req)) {
      query.loanType = "Education Loan";
    }

    const loans = await Loan.find(query)
      .populate(
        "account",
        "accountNumber accountType"
      )
      .sort({ createdAt: -1 });

    res.json({
      loans,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE LOAN
|--------------------------------------------------------------------------
*/

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

      /*
       * Additional protection for student
       * customers.
       *
       * If an old/non-standard loan somehow
       * exists for a student, it should not be
       * exposed through the student flow.
       */
      if (
        isStudentUser(req) &&
        loan.loanType !==
          "Education Loan"
      ) {
        return res.status(403).json({
          message:
            "Students can access only Education Loan applications.",
        });
      }

      const history =
        await LoanHistory.find({
          loan: loan._id,
        })
          .populate(
            "performedBy",
            "name email"
          )
          .sort({ createdAt: 1 });

      res.json({
        loan,
        history,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| APPLY FOR LOAN
|--------------------------------------------------------------------------
*/

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

      /*
       * Validate loan type according to
       * customer type.
       *
       * Personal:
       *   Personal / Education / Vehicle /
       *   Home / Emergency
       *
       * Student:
       *   Education only
       */
      if (
        !isAllowedLoanType(
          req,
          loanType
        )
      ) {
        if (isStudentUser(req)) {
          return res.status(403).json({
            message:
              "Students can apply only for Education Loans.",
          });
        }

        return res.status(400).json({
          message:
            "Invalid loan type.",
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

      /*
       * Make sure the account belongs
       * to the logged-in user.
       */
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

      /*
       * Basic amount validation
       */
      if (
        !amount ||
        amount < 1000
      ) {
        return res.status(400).json({
          message:
            "Requested amount must be at least ₹1,000.",
        });
      }

      /*
       * Income validation
       */
      if (
        !income ||
        income < 0
      ) {
        return res.status(400).json({
          message:
            "Monthly income is required.",
        });
      }

      /*
       * Credit score validation
       */
      if (
        !score ||
        score < 0
      ) {
        return res.status(400).json({
          message:
            "Credit score is required.",
        });
      }

      /*
       * Tenure validation
       */
      if (
        !tenure ||
        tenure < 1
      ) {
        return res.status(400).json({
          message:
            "Tenure must be at least one month.",
        });
      }

      /*
       * Calculate eligible loan limit
       */
      const eligibleLimit =
        Loan.calculateEligibleLimit({
          monthlyIncome: income,
          creditScore: score,
          existingLoanAmount:
            existing,
        });

      if (
        eligibleLimit <= 0
      ) {
        return res.status(400).json({
          message:
            "You do not currently meet the project eligibility rules.",
          eligibleLimit: 0,
        });
      }

      /*
       * Requested amount cannot exceed
       * eligible amount.
       */
      if (
        amount >
        eligibleLimit
      ) {
        return res.status(400).json({
          message:
            `Requested amount exceeds your eligible limit of ₹${eligibleLimit.toLocaleString(
              "en-IN"
            )}.`,
          eligibleLimit,
        });
      }

      /*
       * Generate loan ID
       */
      const loanId =
        await Loan.generateLoanId();

      /*
       * Student Education Loan:
       * 8% interest rate.
       *
       * Other customer types continue
       * using the existing configured rates.
       */
      const interestRate =
        INTEREST_RATES[
          loanType
        ] || 10;

      /*
       * Calculate EMI
       */
      const monthlyPayment =
        Loan.calculateEMI(
          amount,
          interestRate,
          tenure
        );

      /*
       * Create loan
       */
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

      /*
       * Create loan history
       */
      await LoanHistory.create({
        loan: loan._id,

        action:
          "Loan Submitted",

        oldStatus: "",

        newStatus:
          "PENDING",

        performedBy:
          req.user._id,

        comment:
          "Loan application submitted.",
      });

      /*
       * Notification
       */
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

export default router;