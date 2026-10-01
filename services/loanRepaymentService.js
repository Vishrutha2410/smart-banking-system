import LoanRepayment from "../models/LoanRepayment.js";

const addMonthsSafe = (
  date,
  months
) => {
  const original = new Date(date);

  const year =
    original.getFullYear();

  const month =
    original.getMonth();

  const day =
    original.getDate();

  const result = new Date(
    year,
    month,
    1
  );

  result.setMonth(
    result.getMonth() + months
  );

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(
    Math.min(day, lastDay)
  );

  return result;
};

// ======================================================
// CREATE REPAYMENT SCHEDULE
// ======================================================

export const ensureRepaymentSchedule =
  async (loan) => {
    if (!loan) {
      throw new Error(
        "Loan is required."
      );
    }

    if (
      !loan.disbursedDate &&
      !loan.repaymentStartDate
    ) {
      return [];
    }

    const existing =
      await LoanRepayment.find({
        loan: loan._id,
      }).sort({
        installmentNumber: 1,
      });

    if (
      existing.length >=
      loan.tenureMonths
    ) {
      return existing;
    }

    const repaymentStart =
      loan.repaymentStartDate ||
      addMonthsSafe(
        loan.disbursedDate,
        1
      );

    const monthlyPayment =
      Number(
        loan.monthlyPayment || 0
      );

    const totalRepayment =
      Number(
        loan.totalRepaymentAmount ||
          monthlyPayment *
            loan.tenureMonths
      );

    const documents = [];

    for (
      let index = existing.length;
      index < loan.tenureMonths;
      index += 1
    ) {
      const installmentNumber =
        index + 1;

      const dueDate =
        addMonthsSafe(
          repaymentStart,
          index
        );

      let amountDue =
        monthlyPayment;

      // Adjust final installment
      // for rounding differences.
      if (
        installmentNumber ===
        loan.tenureMonths
      ) {
        const previousAmount =
          monthlyPayment *
          (loan.tenureMonths - 1);

        amountDue = Math.max(
          0,
          totalRepayment -
            previousAmount
        );
      }

      documents.push({
        loan: loan._id,
        user: loan.user,
        account: loan.account,
        installmentNumber,
        dueDate,
        amountDue,
        amountPaid: 0,
        status: "PENDING",
      });
    }

    if (documents.length > 0) {
      await LoanRepayment.insertMany(
        documents,
        {
          ordered: true,
        }
      );
    }

    return LoanRepayment.find({
      loan: loan._id,
    }).sort({
      installmentNumber: 1,
    });
  };

// ======================================================
// UPDATE OVERDUE INSTALLMENTS
// ======================================================

export const syncRepaymentStatuses =
  async (loanId) => {
    const now = new Date();

    await LoanRepayment.updateMany(
      {
        loan: loanId,
        status: "PENDING",
        dueDate: {
          $lt: now,
        },
      },
      {
        $set: {
          status: "OVERDUE",
        },
      }
    );

    return LoanRepayment.find({
      loan: loanId,
    }).sort({
      installmentNumber: 1,
    });
  };

// ======================================================
// UPDATE LOAN REPAYMENT SUMMARY
// ======================================================

export const syncLoanRepaymentSummary =
  async (loan) => {
    if (!loan) {
      return null;
    }

    const repayments =
      await syncRepaymentStatuses(
        loan._id
      );

    if (
      repayments.length === 0
    ) {
      return loan;
    }

    const totalPaid =
      repayments.reduce(
        (sum, repayment) =>
          sum +
          Number(
            repayment.amountPaid || 0
          ),
        0
      );

    const totalDue =
      repayments.reduce(
        (sum, repayment) =>
          sum +
          Number(
            repayment.amountDue || 0
          ),
        0
      );

    const paidInstallments =
      repayments.filter(
        (repayment) =>
          repayment.status === "PAID"
      ).length;

    const overdueAmount =
      repayments
        .filter(
          (repayment) =>
            repayment.status ===
            "OVERDUE"
        )
        .reduce(
          (sum, repayment) =>
            sum +
            Math.max(
              0,
              Number(
                repayment.amountDue
              ) -
                Number(
                  repayment.amountPaid ||
                    0
                )
            ),
          0
        );

    const nextRepayment =
      repayments.find(
        (repayment) =>
          repayment.status !==
          "PAID"
      );

    loan.totalRepaymentAmount =
      totalDue;

    loan.totalPaidAmount =
      totalPaid;

    loan.remainingAmount =
      Math.max(
        0,
        totalDue - totalPaid
      );

    loan.paidInstallments =
      paidInstallments;

    loan.overdueAmount =
      overdueAmount;

    loan.nextDueDate =
      nextRepayment?.dueDate ||
      null;

    if (
      loan.remainingAmount <= 0 &&
      repayments.length > 0
    ) {
      loan.status = "CLOSED";
    } else if (
      overdueAmount > 0 &&
      ["ACTIVE", "REPAYMENT"].includes(
        loan.status
      )
    ) {
      loan.status = "OVERDUE";
    } else if (
      loan.disbursedDate &&
      ["DISBURSED", "ACTIVE"].includes(
        loan.status
      )
    ) {
      loan.status = "ACTIVE";
    } else if (
      loan.disbursedDate &&
      loan.status === "OVERDUE"
    ) {
      loan.status = "OVERDUE";
    }

    await loan.save();

    return loan;
  };