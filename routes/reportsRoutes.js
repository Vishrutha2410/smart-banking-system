import express from "express";
import mongoose from "mongoose";

import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import Bank from "../models/Bank.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

/*
==========================================================
HELPERS
==========================================================
*/

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const getDateRange = ({
  period = "monthly",
  startDate,
  endDate,
  year,
  month,
}) => {
  const now = new Date();

  let rangeStart;
  let rangeEnd;

  if (period === "custom") {
    if (!startDate || !endDate) {
      throw new Error(
        "Start date and end date are required for a custom report."
      );
    }

    rangeStart = new Date(`${startDate}T00:00:00`);

    /*
     * End date is inclusive.
     * Add one day so transactions on the selected
     * end date are included.
     */
    rangeEnd = new Date(`${endDate}T00:00:00`);
    rangeEnd.setDate(rangeEnd.getDate() + 1);
  } else if (period === "yearly") {
    const selectedYear =
      Number(year) || now.getFullYear();

    rangeStart = new Date(
      selectedYear,
      0,
      1
    );

    rangeEnd = new Date(
      selectedYear + 1,
      0,
      1
    );
  } else {
    const selectedYear =
      Number(year) || now.getFullYear();

    const selectedMonth = month
      ? Number(month) - 1
      : now.getMonth();

    rangeStart = new Date(
      selectedYear,
      selectedMonth,
      1
    );

    rangeEnd = new Date(
      selectedYear,
      selectedMonth + 1,
      1
    );
  }

  return {
    rangeStart,
    rangeEnd,
  };
};

/*
==========================================================
NORMAL REPORT
==========================================================
GET /api/reports
==========================================================
*/

router.get("/", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(
      req.user._id
    );

    const {
      period = "monthly",
      startDate,
      endDate,
      year,
      month,
    } = req.query;

    const {
      rangeStart,
      rangeEnd,
    } = getDateRange({
      period,
      startDate,
      endDate,
      year,
      month,
    });

    const transactions =
      await Transaction.find({
        user: userId,
        date: {
          $gte: rangeStart,
          $lt: rangeEnd,
        },
      })
        .sort({
          date: -1,
        })
        .lean();

    const totalIncome = transactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Number(transaction.amount || 0),
        0
      );

    const totalExpenses = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum +
          Number(transaction.amount || 0),
        0
      );

    const savings =
      totalIncome - totalExpenses;

    const categoryTotals = {};

    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .forEach((transaction) => {
        const category =
          transaction.category ||
          "General";

        categoryTotals[category] =
          (categoryTotals[category] || 0) +
          Number(transaction.amount || 0);
      });

    const categoryBreakdown =
      Object.entries(categoryTotals)
        .map(
          ([category, total]) => ({
            category,
            total,
          })
        )
        .sort(
          (a, b) =>
            Number(b.total) -
            Number(a.total)
        );

    res.status(200).json({
      range: {
        start: rangeStart,
        end: rangeEnd,
      },

      totalIncome,

      totalExpenses,

      savings,

      transactionCount:
        transactions.length,

      categoryBreakdown,

      transactions,
    });
  } catch (error) {
    next(error);
  }
});

/*
==========================================================
BANK STATEMENT
==========================================================

GET /api/reports/statement

Query:

period=monthly
month=10
year=2026
accountId=<optional>

OR

period=yearly
year=2026

OR

period=custom
startDate=2026-10-01
endDate=2026-10-31

If accountId is not supplied:
all user's accounts are included.

==========================================================
*/

router.get(
  "/statement",
  async (req, res, next) => {
    try {
      const userId =
        new mongoose.Types.ObjectId(
          req.user._id
        );

      const {
        period = "monthly",
        startDate,
        endDate,
        year,
        month,
        accountId,
      } = req.query;

      /*
      ------------------------------------------------------
      DATE RANGE
      ------------------------------------------------------
      */

      const {
        rangeStart,
        rangeEnd,
      } = getDateRange({
        period,
        startDate,
        endDate,
        year,
        month,
      });

      /*
      ------------------------------------------------------
      USER ACCOUNTS
      ------------------------------------------------------
      */

      const accountFilter = {
        user: userId,
      };

      if (accountId) {
        if (!isValidObjectId(accountId)) {
          return res.status(400).json({
            message:
              "Invalid account ID.",
          });
        }

        accountFilter._id =
          accountId;
      }

      const accounts =
        await Account.find(
          accountFilter
        )
          .populate(
            "bank",
            "bankName shortName"
          )
          .sort({
            createdAt: 1,
          })
          .lean();

      if (!accounts.length) {
        return res.status(404).json({
          message:
            "No bank account found for this user.",
        });
      }

      const accountIds =
        accounts.map(
          (account) => account._id
        );

      /*
      ------------------------------------------------------
      TRANSACTIONS
      ------------------------------------------------------
      */

      const transactions =
        await Transaction.find({
          user: userId,

          account: {
            $in: accountIds,
          },

          date: {
            $gte: rangeStart,
            $lt: rangeEnd,
          },
        })
          .sort({
            date: 1,
          })
          .lean();

      /*
      ------------------------------------------------------
      STATEMENT ACCOUNT MAP
      ------------------------------------------------------
      */

      const accountMap =
        new Map();

      accounts.forEach(
        (account) => {
          accountMap.set(
            String(account._id),
            account
          );
        }
      );

      /*
      ------------------------------------------------------
      CALCULATE STATEMENT ENTRIES
      ------------------------------------------------------
      */

      const statementTransactions =
        transactions.map(
          (transaction) => {
            const transactionAccount =
              accountMap.get(
                String(
                  transaction.account
                )
              );

            let credit = 0;
            let debit = 0;

            /*
            INCOME
            */

            if (
              transaction.type ===
              "income"
            ) {
              credit =
                Number(
                  transaction.amount || 0
                );
            }

            /*
            EXPENSE
            */

            else if (
              transaction.type ===
              "expense"
            ) {
              debit =
                Number(
                  transaction.amount || 0
                );
            }

            /*
            TRANSFER
            */

            else if (
              transaction.type ===
              "transfer"
            ) {
              /*
              If this transaction belongs
              to the sender account, treat it
              as debit.
              */

              if (
                transaction.senderAccount &&
                String(
                  transaction.senderAccount
                ) ===
                  String(
                    transaction.account
                  )
              ) {
                debit =
                  Number(
                    transaction.amount ||
                      0
                  );
              }

              /*
              If this transaction belongs
              to the receiver account, treat it
              as credit.
              */

              else if (
                transaction.receiverAccount &&
                String(
                  transaction.receiverAccount
                ) ===
                  String(
                    transaction.account
                  )
              ) {
                credit =
                  Number(
                    transaction.amount ||
                      0
                  );
              }
            }

            return {
              _id:
                transaction._id,

              transactionId:
                transaction.transactionId ||
                "",

              referenceNumber:
                transaction.referenceNumber ||
                "",

              date:
                transaction.date,

              description:
                transaction.description ||
                transaction.category ||
                "Bank Transaction",

              category:
                transaction.category ||
                "General",

              type:
                transaction.type ||
                "",

              transactionKind:
                transaction.transactionKind ||
                null,

              transferMethod:
                transaction.transferMethod ||
                null,

              status:
                transaction.status ||
                "SUCCESS",

              amount:
                Number(
                  transaction.amount || 0
                ),

              credit,

              debit,

              accountId:
                transaction.account,

              accountNumber:
                transactionAccount
                  ?.accountNumber ||
                "",

              accountType:
                transactionAccount
                  ?.accountType ||
                "",

              ifsc:
                transactionAccount
                  ?.ifsc ||
                "",

              bankName:
                transactionAccount
                  ?.bank?.bankName ||
                "Smart Banking",
            };
          }
        );

      /*
      ------------------------------------------------------
      OPENING BALANCE
      ------------------------------------------------------

      We don't store balance-after-transaction
      in the Transaction model.

      Therefore, the opening balance is calculated
      from the current account balance and all
      transactions after the selected period.

      This provides a consistent statement without
      modifying your Transaction schema.
      ------------------------------------------------------
      */

      const statementByAccount =
        {};

      for (
        const account of accounts
      ) {
        const currentBalance =
          Number(
            account.balance || 0
          );

        /*
        Get all transactions for this
        account after the selected period.
        */

        const futureTransactions =
          await Transaction.find({
            user: userId,

            account:
              account._id,

            date: {
              $gte: rangeEnd,
            },
          })
            .sort({
              date: 1,
            })
            .lean();

        let amountAfterPeriod = 0;

        futureTransactions.forEach(
          (transaction) => {
            const amount =
              Number(
                transaction.amount || 0
              );

            if (
              transaction.type ===
              "income"
            ) {
              amountAfterPeriod +=
                amount;
            }

            else if (
              transaction.type ===
              "expense"
            ) {
              amountAfterPeriod -=
                amount;
            }

            else if (
              transaction.type ===
              "transfer"
            ) {
              if (
                transaction.senderAccount &&
                String(
                  transaction.senderAccount
                ) ===
                  String(account._id)
              ) {
                amountAfterPeriod -=
                  amount;
              }

              else if (
                transaction.receiverAccount &&
                String(
                  transaction.receiverAccount
                ) ===
                  String(account._id)
              ) {
                amountAfterPeriod +=
                  amount;
              }
            }
          }
        );

        const closingBalance =
          currentBalance -
          amountAfterPeriod;

        /*
        Transactions before the selected
        period can be used to calculate
        the opening balance.

        Opening balance =
        closing balance - period net change
        */

        const accountTransactions =
          statementTransactions.filter(
            (transaction) =>
              String(
                transaction.accountId
              ) ===
              String(account._id)
          );

        const periodCredits =
          accountTransactions.reduce(
            (sum, transaction) =>
              sum +
              Number(
                transaction.credit ||
                  0
              ),
            0
          );

        const periodDebits =
          accountTransactions.reduce(
            (sum, transaction) =>
              sum +
              Number(
                transaction.debit ||
                  0
              ),
            0
          );

        const openingBalance =
          closingBalance -
          periodCredits +
          periodDebits;

        statementByAccount[
          String(account._id)
        ] = {
          openingBalance,
          closingBalance,
          totalCredits:
            periodCredits,
          totalDebits:
            periodDebits,
        };
      }

      /*
      ------------------------------------------------------
      ADD RUNNING BALANCE
      ------------------------------------------------------
      */

      const runningBalances =
        {};

      accounts.forEach(
        (account) => {
          runningBalances[
            String(account._id)
          ] =
            Number(
              statementByAccount[
                String(account._id)
              ]?.openingBalance || 0
            );
        }
      );

      const statement =
        statementTransactions.map(
          (transaction) => {
            const key =
              String(
                transaction.accountId
              );

            let balance =
              runningBalances[key] || 0;

            balance +=
              Number(
                transaction.credit ||
                  0
              );

            balance -=
              Number(
                transaction.debit ||
                  0
              );

            runningBalances[key] =
              balance;

            return {
              ...transaction,
              balance,
            };
          }
        );

      /*
      ------------------------------------------------------
      SUMMARY
      ------------------------------------------------------
      */

      const totalCredits =
        statement.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.credit || 0
            ),
          0
        );

      const totalDebits =
        statement.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.debit || 0
            ),
          0
        );

      /*
      ------------------------------------------------------
      RESPONSE
      ------------------------------------------------------
      */

      res.status(200).json({
        success: true,

        holder: {
          name:
            req.user.name || "",

          email:
            req.user.email || "",

          phone:
            req.user.phone || "",
        },

        period: {
          type: period,

          start:
            rangeStart,

          end:
            rangeEnd,
        },

        accounts:
          accounts.map(
            (account) => ({
              _id:
                account._id,

              accountNumber:
                account.accountNumber,

              accountType:
                account.accountType,

              balance:
                Number(
                  account.balance || 0
                ),

              currency:
                account.currency ||
                "INR",

              ifsc:
                account.ifsc,

              upiId:
                account.upiId || "",

              fullName:
                account.fullName ||
                req.user.name ||
                "",

              email:
                account.email ||
                req.user.email ||
                "",

              bankName:
                account.bank?.bankName ||
                "Smart Banking",

              bankShortName:
                account.bank?.shortName ||
                "",
            })
          ),

        summary: {
          transactionCount:
            statement.length,

          totalCredits,

          totalDebits,

          netMovement:
            totalCredits -
            totalDebits,
        },

        accountBalances:
          statementByAccount,

        transactions:
          statement,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;