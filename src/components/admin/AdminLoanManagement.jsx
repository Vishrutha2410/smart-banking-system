import { useEffect, useState } from "react";

import {
  FiEye,
  FiCheck,
  FiX,
  FiDollarSign,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import {
  getLoanManagementLoans,
  getLoanManagementDetails,
  approveLoan,
  rejectLoan,
  disburseLoan,
} from "../../services/adminService";

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const statusClass = (
  status
) => {
  const value =
    String(status || "")
      .toUpperCase();

  if (value === "PENDING") {
    return "bg-amber-50 text-amber-700";
  }

  if (
    [
      "APPROVED",
      "ACTIVE",
      "REPAYMENT",
    ].includes(value)
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value === "OVERDUE") {
    return "bg-red-50 text-red-700";
  }

  if (value === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  if (value === "CLOSED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-blue-50 text-blue-700";
};

const AdminLoanManagement =
  () => {
    const [loans, setLoans] =
      useState([]);

    const [loading, setLoading] =
      useState(true);

    const [selected, setSelected] =
      useState(null);

    const [error, setError] =
      useState("");

    const [processing, setProcessing] =
      useState(false);

    const [comment, setComment] =
      useState("");

    const [rejectionReason, setRejectionReason] =
      useState("");

    const [approvedAmount, setApprovedAmount] =
      useState("");

    const loadLoans =
      async () => {
        setLoading(true);

        try {
          const data =
            await getLoanManagementLoans();

          setLoans(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              "Unable to load loans."
          );
        } finally {
          setLoading(false);
        }
      };

    useEffect(() => {
      loadLoans();
    }, []);

    const openLoan =
      async (loan) => {
        setError("");

        try {
          const data =
            await getLoanManagementDetails(
              loan._id
            );

          setSelected(data);

          setApprovedAmount(
            String(
              data.loan
                ?.approvedAmount ||
                data.loan
                  ?.requestedAmount ||
                ""
            )
          );
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              "Unable to load loan details."
          );
        }
      };

    const handleApprove =
      async () => {
        if (
          !selected?.loan?._id
        ) {
          return;
        }

        setProcessing(true);
        setError("");

        try {
          await approveLoan(
            selected.loan._id,
            Number(
              approvedAmount
            ),
            comment
          );

          setComment("");

          await loadLoans();

          await openLoan({
            _id:
              selected.loan._id,
          });
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              "Unable to approve loan."
          );
        } finally {
          setProcessing(
            false
          );
        }
      };

    const handleReject =
      async () => {
        if (
          !selected?.loan?._id
        ) {
          return;
        }

        if (
          !rejectionReason.trim()
        ) {
          setError(
            "Please provide a rejection reason."
          );
          return;
        }

        setProcessing(true);
        setError("");

        try {
          await rejectLoan(
            selected.loan._id,
            rejectionReason
          );

          setRejectionReason("");

          await loadLoans();

          await openLoan({
            _id:
              selected.loan._id,
          });
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              "Unable to reject loan."
          );
        } finally {
          setProcessing(
            false
          );
        }
      };

    const handleDisburse =
      async () => {
        if (
          !selected?.loan?._id
        ) {
          return;
        }

        const confirmed =
          window.confirm(
            `Disburse ${formatAmount(
              selected.loan
                .approvedAmount
            )} to ${selected.loan.user?.name || "this customer"}?`
          );

        if (!confirmed) {
          return;
        }

        setProcessing(true);
        setError("");

        try {
          await disburseLoan(
            selected.loan._id
          );

          await loadLoans();

          await openLoan({
            _id:
              selected.loan._id,
          });
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              "Unable to disburse loan."
          );
        } finally {
          setProcessing(
            false
          );
        }
      };

    if (loading) {
      return (
        <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
          Loading loan applications...
        </div>
      );
    }

    return (
      <div className="space-y-4">

        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">
              Total
            </p>
            <p className="mt-1 text-xl font-bold">
              {loans.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">
              Pending
            </p>
            <p className="mt-1 text-xl font-bold text-amber-600">
              {
                loans.filter(
                  (loan) =>
                    loan.status ===
                    "PENDING"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">
              Active
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {
                loans.filter(
                  (loan) =>
                    [
                      "ACTIVE",
                      "REPAYMENT",
                    ].includes(
                      loan.status
                    )
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">
              Overdue
            </p>
            <p className="mt-1 text-xl font-bold text-red-600">
              {
                loans.filter(
                  (loan) =>
                    loan.status ===
                    "OVERDUE"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">
              Closed
            </p>
            <p className="mt-1 text-xl font-bold text-slate-600">
              {
                loans.filter(
                  (loan) =>
                    loan.status ===
                    "CLOSED"
                ).length
              }
            </p>
          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

              <tr>
                <th className="px-4 py-3">
                  Customer
                </th>

                <th className="px-4 py-3">
                  Loan
                </th>

                <th className="px-4 py-3 text-right">
                  Amount
                </th>

                <th className="px-4 py-3">
                  EMI
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Action
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loans.map(
                (loan) => (
                  <tr
                    key={
                      loan._id
                    }
                    className="hover:bg-slate-50"
                  >

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {loan.user?.name ||
                          "Unknown"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {loan.user?.email ||
                          ""}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {
                          loan.loanType
                        }
                      </p>

                      <p className="text-xs text-slate-400">
                        {
                          loan.loanId
                        }
                      </p>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <p className="font-semibold">
                        {formatAmount(
                          loan.approvedAmount ||
                            loan.requestedAmount
                        )}
                      </p>

                      {loan.approvedAmount >
                        0 &&
                        loan.approvedAmount !==
                          loan.requestedAmount && (
                          <p className="text-xs text-emerald-600">
                            Approved amount
                          </p>
                        )}
                    </td>

                    <td className="px-4 py-4">
                      {formatAmount(
                        loan.monthlyPayment
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          loan.status
                        )}`}
                      >
                        {
                          loan.status
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          openLoan(
                            loan
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FiEye />
                        Review
                      </button>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

        {/* DETAIL MODAL */}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">

            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">

              <div className="flex items-start justify-between border-b p-5">

                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Loan Review
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    {
                      selected.loan
                        ?.loanType
                    }
                  </h2>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {
                      selected.loan
                        ?.loanId
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      null
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <FiX />
                </button>

              </div>

              <div className="max-h-[80vh] overflow-y-auto space-y-5 p-5">

                {/* CUSTOMER */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Applicant
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {
                        selected.loan
                          ?.user
                          ?.name
                      }
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold">
                      {
                        selected.loan
                          ?.user
                          ?.email
                      }
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Customer Type
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {
                        selected.loan
                          ?.user
                          ?.customerType
                      }
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Account
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        selected.loan
                          ?.account
                          ?.accountNumber
                      }
                    </p>
                  </div>

                </div>

                {/* REVIEW INFORMATION */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-400">
                      Requested
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAmount(
                        selected.loan
                          ?.requestedAmount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Eligible Limit
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAmount(
                        selected.loan
                          ?.eligibleLimit
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Monthly Income
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAmount(
                        selected.loan
                          ?.monthlyIncome
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Credit Score
                    </p>
                    <p className="mt-1 font-semibold">
                      {
                        selected.loan
                          ?.creditScore
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Existing Loans
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAmount(
                        selected.loan
                          ?.existingLoanAmount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Interest
                    </p>
                    <p className="mt-1 font-semibold">
                      {
                        selected.loan
                          ?.interestRate
                      }%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Tenure
                    </p>
                    <p className="mt-1 font-semibold">
                      {
                        selected.loan
                          ?.tenureMonths
                      } months
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      EMI
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAmount(
                        selected.loan
                          ?.monthlyPayment
                      )}
                    </p>
                  </div>

                </div>

                {/* PURPOSE */}

                <div className="rounded-lg border border-slate-100 p-4">

                  <p className="text-xs uppercase text-slate-400">
                    Purpose
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {
                      selected.loan
                        ?.purpose ||
                      "No purpose provided."
                    }
                  </p>

                </div>

                {/* ADMIN ACTIONS */}

                {selected.loan
                  ?.status ===
                  "PENDING" && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                    <h3 className="text-sm font-semibold text-emerald-900">
                      Loan Decision
                    </h3>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Approved Amount
                        </label>

                        <input
                          type="number"
                          min="1"
                          max={
                            selected.loan
                              ?.requestedAmount
                          }
                          value={
                            approvedAmount
                          }
                          onChange={(
                            event
                          ) =>
                            setApprovedAmount(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Admin Comment
                        </label>

                        <input
                          value={
                            comment
                          }
                          onChange={(
                            event
                          ) =>
                            setComment(
                              event.target
                                .value
                            )
                          }
                          placeholder="Review comment"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">

                      <button
                        type="button"
                        disabled={
                          processing
                        }
                        onClick={
                          handleApprove
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <FiCheck />
                        Approve
                      </button>

                    </div>

                    <div className="mt-4 border-t border-emerald-100 pt-4">

                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Rejection Reason
                      </label>

                      <div className="flex gap-2">

                        <input
                          value={
                            rejectionReason
                          }
                          onChange={(
                            event
                          ) =>
                            setRejectionReason(
                              event.target
                                .value
                            )
                          }
                          placeholder="Reason for rejection"
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        />

                        <button
                          type="button"
                          disabled={
                            processing
                          }
                          onClick={
                            handleReject
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          <FiX />
                          Reject
                        </button>

                      </div>

                    </div>

                  </div>
                )}

                {/* DISBURSE */}

                {selected.loan
                  ?.status ===
                  "APPROVED" && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <p className="text-sm font-semibold text-blue-900">
                      Loan is approved
                    </p>

                    <p className="mt-1 text-xs text-blue-700">
                      The approved amount has not
                      been credited yet. Disburse the
                      loan to create the repayment
                      schedule.
                    </p>

                    <button
                      type="button"
                      disabled={
                        processing
                      }
                      onClick={
                        handleDisburse
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <FiDollarSign />
                      Disburse Loan
                    </button>

                  </div>
                )}

                {/* REPAYMENT SUMMARY */}

                {[
                  "ACTIVE",
                  "REPAYMENT",
                  "OVERDUE",
                  "CLOSED",
                ].includes(
                  selected.loan
                    ?.status
                ) && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Paid
                      </p>
                      <p className="mt-1 font-bold text-emerald-700">
                        {formatAmount(
                          selected.loan
                            ?.totalPaidAmount
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Remaining
                      </p>
                      <p className="mt-1 font-bold">
                        {formatAmount(
                          selected.loan
                            ?.remainingAmount
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Paid EMIs
                      </p>
                      <p className="mt-1 font-bold">
                        {
                          selected.loan
                            ?.paidInstallments
                        }
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Next Due
                      </p>
                      <p className="mt-1 font-bold">
                        {formatDate(
                          selected.loan
                            ?.nextDueDate
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-red-50 p-3">
                      <p className="text-xs text-red-500">
                        Overdue
                      </p>
                      <p className="mt-1 font-bold text-red-700">
                        {formatAmount(
                          selected.loan
                            ?.overdueAmount
                        )}
                      </p>
                    </div>

                  </div>
                )}

                {/* REPAYMENT SCHEDULE */}

                {selected.repayments
                  ?.length > 0 && (
                  <div>

                    <h3 className="mb-3 text-sm font-semibold">
                      Repayment Schedule
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">

                      <table className="min-w-full text-sm">

                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

                          <tr>
                            <th className="px-4 py-3">
                              EMI
                            </th>

                            <th className="px-4 py-3">
                              Due
                            </th>

                            <th className="px-4 py-3 text-right">
                              Amount
                            </th>

                            <th className="px-4 py-3 text-right">
                              Paid
                            </th>

                            <th className="px-4 py-3">
                              Status
                            </th>
                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {selected.repayments.map(
                            (
                              repayment
                            ) => (
                              <tr
                                key={
                                  repayment._id
                                }
                              >

                                <td className="px-4 py-3">
                                  #
                                  {
                                    repayment.installmentNumber
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {formatDate(
                                    repayment.dueDate
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {formatAmount(
                                    repayment.amountDue
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right text-emerald-700">
                                  {formatAmount(
                                    repayment.amountPaid
                                  )}
                                </td>

                                <td className="px-4 py-3">

                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                      repayment.status ===
                                      "PAID"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : repayment.status ===
                                          "OVERDUE"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {
                                      repayment.status
                                    }
                                  </span>

                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    );
  };

export default AdminLoanManagement;