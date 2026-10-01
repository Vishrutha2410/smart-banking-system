import { useEffect, useState } from "react";

import {
  FiPlus,
  FiFileText,
  FiBookOpen,
  FiEye,
  FiCreditCard,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  getLoans,
  applyForLoan,
  getLoanById,
  payLoanRepayment,
} from "../services/loanService";

import api from "../services/api";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const PERSONAL_LOAN_TYPES = [
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
  "Home Loan": 7,
  "Vehicle Loan": 9,
  "Emergency Loan": 13,
};

const STATUS_STYLES = {
  PENDING:
    "bg-amber-50 text-amber-700",

  UNDER_REVIEW:
    "bg-blue-50 text-blue-700",

  DOCUMENTS_REQUIRED:
    "bg-orange-50 text-orange-700",

  APPROVED:
    "bg-emerald-50 text-emerald-700",

  DISBURSED:
    "bg-blue-50 text-blue-700",

  ACTIVE:
    "bg-brand-50 text-brand-700",

  REPAYMENT:
    "bg-indigo-50 text-indigo-700",

  OVERDUE:
    "bg-red-50 text-red-700",

  REJECTED:
    "bg-red-50 text-red-700",

  CLOSED:
    "bg-slate-100 text-slate-600",
};

const formatCurrency = (value) => {
  return (
    Number(value || 0)
      .toLocaleString("en-IN")
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (
  value
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatStatus = (
  status = ""
) => {
  const value =
    String(status)
      .toLowerCase()
      .replaceAll("_", " ");

  return value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const calculateEMI = (
  principal,
  annualRate,
  tenureMonths
) => {
  const monthlyRate =
    annualRate / 12 / 100;

  if (
    !principal ||
    !tenureMonths
  ) {
    return 0;
  }

  if (monthlyRate === 0) {
    return Math.round(
      principal /
        tenureMonths
    );
  }

  const emi =
    (principal *
      monthlyRate *
      Math.pow(
        1 + monthlyRate,
        tenureMonths
      )) /
    (Math.pow(
      1 + monthlyRate,
      tenureMonths
    ) - 1);

  return Math.round(emi);
};

const Loans = () => {
  const { user } =
    useAuth();

  const customerType =
    String(
      user?.customerType ||
        "personal"
    )
      .trim()
      .toLowerCase();

  const isStudent =
    customerType ===
    "student";

  const loanTypes =
    isStudent
      ? STUDENT_LOAN_TYPES
      : PERSONAL_LOAN_TYPES;

  const [loans, setLoans] =
    useState([]);

  const [accounts, setAccounts] =
    useState([]);

  const [status, setStatus] =
    useState("loading");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedLoan, setSelectedLoan] =
    useState(null);

  const [loanDetailsLoading, setLoanDetailsLoading] =
    useState(false);

  const [paymentAccountId, setPaymentAccountId] =
    useState("");

  const [paying, setPaying] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const defaultLoanType =
    isStudent
      ? "Education Loan"
      : "Personal Loan";

  const [form, setForm] =
    useState({
      loanType:
        defaultLoanType,
      accountId: "",
      amount: "",
      monthlyIncome: "",
      creditScore: "",
      existingLoanAmount: "0",
      tenure: "12",
      purpose: "",
    });

  // ======================================================
  // LOAD LOANS
  // ======================================================

  const load = async () => {
    setStatus("loading");

    try {
      const data =
        await getLoans();

      const list =
        Array.isArray(data)
          ? data
          : [];

      const visibleLoans =
        isStudent
          ? list.filter(
              (loan) =>
                loan?.loanType ===
                "Education Loan"
            )
          : list;

      setLoans(
        visibleLoans
      );

      setStatus("success");
    } catch (error) {
      console.error(
        "[Loans] Load error:",
        error
      );

      setLoans([]);
      setStatus("error");
    }
  };

  // ======================================================
  // LOAD ACCOUNTS
  // ======================================================

  const loadAccounts =
    async () => {
      try {
        const response =
          await api.get(
            "/accounts"
          );

        const data =
          response.data?.accounts ||
          response.data?.data ||
          response.data;

        const list =
          Array.isArray(data)
            ? data
            : [];

        const activeAccounts =
          list.filter(
            (account) =>
              String(
                account.status
              ).toLowerCase() ===
              "active"
          );

        setAccounts(
          activeAccounts
        );

        if (
          activeAccounts.length >
          0
        ) {
          setForm(
            (previous) => ({
              ...previous,
              accountId:
                previous.accountId ||
                activeAccounts[0]
                  ._id,
            })
          );

          setPaymentAccountId(
            activeAccounts[0]
              ._id
          );
        }
      } catch (error) {
        console.error(
          "[Loans] Account load error:",
          error
        );

        setAccounts([]);
      }
    };

  useEffect(() => {
    load();
    loadAccounts();
  }, [isStudent]);

  // ======================================================
  // EMI PREVIEW
  // ======================================================

  const previewEMI =
    calculateEMI(
      Number(form.amount) || 0,
      INTEREST_RATES[
        form.loanType
      ] || 10,
      Number(form.tenure) || 1
    );

  // ======================================================
  // SUBMIT APPLICATION
  // ======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        isStudent &&
        form.loanType !==
          "Education Loan"
      ) {
        setFormError(
          "Students can apply only for an Education Loan."
        );
        return;
      }

      const amount =
        Number(form.amount);

      const income =
        Number(
          form.monthlyIncome
        );

      const creditScore =
        Number(
          form.creditScore
        );

      const existing =
        Number(
          form.existingLoanAmount
        ) || 0;

      const tenure =
        Number(form.tenure);

      if (!form.accountId) {
        setFormError(
          "Please select an account."
        );
        return;
      }

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 1000
      ) {
        setFormError(
          "Loan amount must be at least ₹1,000."
        );
        return;
      }

      if (
        !Number.isFinite(
          income
        ) ||
        income <= 0
      ) {
        setFormError(
          "Please enter your monthly income."
        );
        return;
      }

      if (
        form.creditScore ===
          "" ||
        !Number.isFinite(
          creditScore
        ) ||
        creditScore < 0
      ) {
        setFormError(
          "Please enter a valid credit score."
        );
        return;
      }

      if (
        !Number.isFinite(
          tenure
        ) ||
        tenure < 1
      ) {
        setFormError(
          "Tenure must be at least 1 month."
        );
        return;
      }

      setSubmitting(true);

      try {
        await applyForLoan({
          loanType:
            isStudent
              ? "Education Loan"
              : form.loanType,

          accountId:
            form.accountId,

          requestedAmount:
            amount,

          monthlyIncome:
            income,

          creditScore,

          existingLoanAmount:
            existing,

          tenureMonths:
            tenure,

          purpose:
            form.purpose,
        });

        setShowModal(false);

        setForm({
          loanType:
            defaultLoanType,
          accountId:
            accounts[0]?._id ||
            "",
          amount: "",
          monthlyIncome: "",
          creditScore: "",
          existingLoanAmount:
            "0",
          tenure: "12",
          purpose: "",
        });

        await load();
      } catch (error) {
        console.error(
          "[Loans] Application error:",
          error
        );

        setFormError(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Could not submit loan application."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ======================================================
  // OPEN LOAN DETAILS
  // ======================================================

  const openLoanDetails =
    async (loan) => {
      setLoanDetailsLoading(
        true
      );
      setPaymentError("");

      try {
        const data =
          await getLoanById(
            loan._id
          );

        setSelectedLoan(
          data
        );

        const firstActiveAccount =
          accounts.find(
            (account) =>
              String(
                account.status
              ).toLowerCase() ===
              "active"
          );

        setPaymentAccountId(
          firstActiveAccount?._id ||
            loan.account?._id ||
            ""
        );
      } catch (error) {
        console.error(
          "[Loans] Details error:",
          error
        );

        setPaymentError(
          error?.response?.data
            ?.message ||
            "Unable to load loan details."
        );
      } finally {
        setLoanDetailsLoading(
          false
        );
      }
    };

  // ======================================================
  // PAY EMI
  // ======================================================

  const handlePayEMI =
    async () => {
      if (
        !selectedLoan?.loan?._id
      ) {
        return;
      }

      if (
        !paymentAccountId
      ) {
        setPaymentError(
          "Please select a payment account."
        );
        return;
      }

      setPaying(true);
      setPaymentError("");

      try {
        const result =
          await payLoanRepayment(
            selectedLoan.loan._id,
            paymentAccountId
          );

        setSelectedLoan(
          (previous) => ({
            ...previous,
            loan:
              result.loan,
            repayments:
              result.repayments ||
              [],
          })
        );

        await load();
      } catch (error) {
        console.error(
          "[Loans] EMI payment error:",
          error
        );

        setPaymentError(
          error?.response?.data
            ?.message ||
            "Unable to pay EMI."
        );
      } finally {
        setPaying(false);
      }
    };

  // ======================================================
  // LOADING
  // ======================================================

  if (
    status ===
    "loading"
  ) {
    return (
      <Loader
        label="Loading loans..."
      />
    );
  }

  if (
    status ===
    "error"
  ) {
    return (
      <ErrorState
        onRetry={load}
      />
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isStudent && (
              <FiBookOpen className="h-5 w-5 text-brand-600" />
            )}

            <h1 className="text-2xl font-bold text-slate-900">
              {isStudent
                ? "Education Loans"
                : "Loans"}
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {isStudent
              ? "Apply for and manage your education loans and repayments."
              : "Apply for loans, track approval and manage repayments."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");

            setForm(
              (previous) => ({
                ...previous,
                loanType:
                  isStudent
                    ? "Education Loan"
                    : previous.loanType,
              })
            );

            setShowModal(
              true
            );
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus />

          {isStudent
            ? "Apply for Education Loan"
            : "Apply for Loan"}
        </button>
      </div>

      {/* STUDENT INFO */}

      {isStudent && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <FiBookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Student Education Loan
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Students can apply only for
              Education Loans. The current
              project interest rate is 8% p.a.
            </p>
          </div>
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            Total Loans
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {loans.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            Active / Repayment
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {
              loans.filter(
                (loan) =>
                  [
                    "ACTIVE",
                    "REPAYMENT",
                    "OVERDUE",
                  ].includes(
                    loan.status
                  )
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            Paid
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-600">
            ₹
            {formatCurrency(
              loans.reduce(
                (sum, loan) =>
                  sum +
                  Number(
                    loan.totalPaidAmount ||
                      0
                  ),
                0
              )
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            Remaining
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            ₹
            {formatCurrency(
              loans.reduce(
                (sum, loan) =>
                  sum +
                  Number(
                    loan.remainingAmount ||
                      0
                  ),
                0
              )
            )}
          </p>
        </div>

      </div>

      {/* LOAN LIST */}

      {!Array.isArray(loans) ||
      loans.length === 0 ? (
        <EmptyState
          title={
            isStudent
              ? "No education loan applications yet"
              : "No loan applications yet"
          }
          icon={FiFileText}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">

          <table className="min-w-full divide-y divide-slate-100 text-sm">

            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

              <tr>
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
                  Paid
                </th>

                <th className="px-4 py-3">
                  Remaining
                </th>

                <th className="px-4 py-3">
                  Next Due
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
                (loan) => {
                  const statusClass =
                    STATUS_STYLES[
                      loan.status
                    ] ||
                    "bg-slate-100 text-slate-600";

                  return (
                    <tr
                      key={
                        loan._id ||
                        loan.loanId
                      }
                      className="hover:bg-slate-50"
                    >

                      <td className="px-4 py-4">

                        <p className="font-semibold text-slate-800">
                          {loan.loanType}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {loan.loanId}
                        </p>

                      </td>

                      <td className="px-4 py-4 text-right font-medium text-slate-900">
                        ₹
                        {formatCurrency(
                          loan.approvedAmount ||
                            loan.requestedAmount
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        ₹
                        {formatCurrency(
                          loan.monthlyPayment
                        )}
                      </td>

                      <td className="px-4 py-4 text-emerald-700">
                        ₹
                        {formatCurrency(
                          loan.totalPaidAmount
                        )}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-800">
                        ₹
                        {formatCurrency(
                          loan.remainingAmount
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {formatDate(
                          loan.nextDueDate
                        )}
                      </td>

                      <td className="px-4 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
                        >
                          {formatStatus(
                            loan.status
                          )}
                        </span>

                      </td>

                      <td className="px-4 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            openLoanDetails(
                              loan
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <FiEye />
                          View
                        </button>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>
      )}

      {/* ======================================================
          APPLY LOAN MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between">

              <div>
                <div className="flex items-center gap-2">

                  {isStudent && (
                    <FiBookOpen className="h-5 w-5 text-brand-600" />
                  )}

                  <h2 className="text-lg font-semibold text-slate-900">
                    {isStudent
                      ? "Apply for Education Loan"
                      : "Apply for Loan"}
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Complete the details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX />
              </button>

            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-5 space-y-4"
            >

              {/* ACCOUNT */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Loan Account
                </label>

                <select
                  value={
                    form.accountId
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        accountId:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >

                  <option value="">
                    Select Account
                  </option>

                  {accounts.map(
                    (account) => (
                      <option
                        key={
                          account._id
                        }
                        value={
                          account._id
                        }
                      >
                        {
                          account.accountNumber
                        }{" "}
                        -{" "}
                        {
                          account.accountType
                        }
                      </option>
                    )
                  )}

                </select>
              </div>

              {/* LOAN TYPE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Loan Type
                </label>

                <select
                  value={
                    form.loanType
                  }
                  disabled={
                    isStudent
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        loanType:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                >

                  {loanTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type} (
                        {
                          INTEREST_RATES[
                            type
                          ]
                        }
                        % p.a.)
                      </option>
                    )
                  )}

                </select>
              </div>

              {/* AMOUNT */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Requested Amount
                </label>

                <input
                  type="number"
                  min="1000"
                  value={
                    form.amount
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        amount:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 200000"
                  required
                />
              </div>

              {/* INCOME */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monthly Income
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.monthlyIncome
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        monthlyIncome:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              {/* CREDIT SCORE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Credit Score
                </label>

                <input
                  type="number"
                  min="0"
                  max="900"
                  value={
                    form.creditScore
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        creditScore:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 750"
                  required
                />
              </div>

              {/* EXISTING LOAN */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Existing Loan Amount
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.existingLoanAmount
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        existingLoanAmount:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* TENURE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tenure (months)
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.tenure
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        tenure:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* PURPOSE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isStudent
                    ? "Education Purpose"
                    : "Purpose"}{" "}
                  (optional)
                </label>

                <input
                  value={
                    form.purpose
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        purpose:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={
                    isStudent
                      ? "Tuition, hostel, books..."
                      : "What is the loan for?"
                  }
                />
              </div>

              {/* EMI PREVIEW */}

              {Number(
                form.amount
              ) > 0 && (
                <div className="rounded-lg bg-brand-50 px-3 py-3 text-sm text-brand-700">
                  Estimated EMI:{" "}
                  <strong>
                    ₹
                    {formatCurrency(
                      previewEMI
                    )}
                  </strong>{" "}
                  / month
                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================
          LOAN DETAILS / REPAYMENT MODAL
      ====================================================== */}

      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">

          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 p-5">

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Loan Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedLoan.loan?.loanType}
                </h2>

                <p className="mt-1 font-mono text-xs text-slate-400">
                  {selectedLoan.loan?.loanId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLoan(
                    null
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>

            </div>

            {loanDetailsLoading ? (
              <div className="p-10">
                <Loader label="Loading loan details..." />
              </div>
            ) : (
              <div className="space-y-6 p-5">

                {/* ERROR */}

                {paymentError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                {/* SUMMARY */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Approved
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      ₹
                      {formatCurrency(
                        selectedLoan
                          .loan
                          ?.approvedAmount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      EMI
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      ₹
                      {formatCurrency(
                        selectedLoan
                          .loan
                          ?.monthlyPayment
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-emerald-700">
                      Paid
                    </p>
                    <p className="mt-1 font-bold text-emerald-800">
                      ₹
                      {formatCurrency(
                        selectedLoan
                          .loan
                          ?.totalPaidAmount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs text-blue-700">
                      Remaining
                    </p>
                    <p className="mt-1 font-bold text-blue-900">
                      ₹
                      {formatCurrency(
                        selectedLoan
                          .loan
                          ?.remainingAmount
                      )}
                    </p>
                  </div>

                </div>

                {/* LOAN INFORMATION */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-400">
                      Interest
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        selectedLoan
                          .loan
                          ?.interestRate
                      }%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Tenure
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        selectedLoan
                          .loan
                          ?.tenureMonths
                      } months
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Next Due
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(
                        selectedLoan
                          .loan
                          ?.nextDueDate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatStatus(
                        selectedLoan
                          .loan
                          ?.status
                      )}
                    </p>
                  </div>

                </div>

                {/* PAYMENT AREA */}

                {[
                  "ACTIVE",
                  "REPAYMENT",
                  "OVERDUE",
                ].includes(
                  selectedLoan
                    .loan
                    ?.status
                ) &&
                  Number(
                    selectedLoan
                      .loan
                      ?.remainingAmount ||
                      0
                  ) > 0 && (
                    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">

                      <div className="flex items-start gap-3">

                        <FiCreditCard className="mt-1 h-5 w-5 text-brand-600" />

                        <div className="flex-1">

                          <p className="text-sm font-semibold text-brand-900">
                            Next EMI
                          </p>

                          <p className="mt-1 text-xs text-brand-700">
                            Pay your next installment
                            directly from one of your
                            active accounts.
                          </p>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">

                            <select
                              value={
                                paymentAccountId
                              }
                              onChange={(event) =>
                                setPaymentAccountId(
                                  event.target
                                    .value
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="">
                                Select Payment Account
                              </option>

                              {accounts.map(
                                (account) => (
                                  <option
                                    key={
                                      account._id
                                    }
                                    value={
                                      account._id
                                    }
                                  >
                                    {
                                      account.accountNumber
                                    }{" "}
                                    - ₹
                                    {formatCurrency(
                                      account.balance
                                    )}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              type="button"
                              onClick={
                                handlePayEMI
                              }
                              disabled={
                                paying
                              }
                              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                            >
                              {paying
                                ? "Processing..."
                                : `Pay EMI ₹${formatCurrency(
                                    selectedLoan
                                      .repayments?.find(
                                        (item) =>
                                          item.status !==
                                          "PAID"
                                      )?.amountDue ||
                                      selectedLoan
                                        .loan
                                        ?.monthlyPayment
                                  )}`}
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                {/* REPAYMENT SCHEDULE */}

                <div>

                  <div className="mb-3 flex items-center gap-2">
                    <FiCalendar className="h-5 w-5 text-slate-500" />

                    <h3 className="text-sm font-semibold text-slate-900">
                      Repayment Schedule
                    </h3>
                  </div>

                  {!selectedLoan.repayments ||
                  selectedLoan
                    .repayments.length ===
                    0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Repayment schedule will
                      appear after the loan is
                      disbursed.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">

                      <table className="min-w-full text-sm">

                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

                          <tr>
                            <th className="px-4 py-3">
                              EMI
                            </th>

                            <th className="px-4 py-3">
                              Due Date
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

                            <th className="px-4 py-3">
                              Paid On
                            </th>
                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {selectedLoan.repayments.map(
                            (repayment) => {

                              const isPaid =
                                repayment.status ===
                                "PAID";

                              const isOverdue =
                                repayment.status ===
                                "OVERDUE";

                              return (
                                <tr
                                  key={
                                    repayment._id
                                  }
                                >

                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    #
                                    {
                                      repayment.installmentNumber
                                    }
                                  </td>

                                  <td className="px-4 py-3 text-slate-500">
                                    {formatDate(
                                      repayment.dueDate
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right font-medium">
                                    ₹
                                    {formatCurrency(
                                      repayment.amountDue
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-right text-emerald-700">
                                    ₹
                                    {formatCurrency(
                                      repayment.amountPaid
                                    )}
                                  </td>

                                  <td className="px-4 py-3">

                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        isPaid
                                          ? "bg-emerald-50 text-emerald-700"
                                          : isOverdue
                                          ? "bg-red-50 text-red-700"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >

                                      {isPaid ? (
                                        <FiCheckCircle />
                                      ) : isOverdue ? (
                                        <FiAlertCircle />
                                      ) : (
                                        <FiClock />
                                      )}

                                      {repayment.status}
                                    </span>

                                  </td>

                                  <td className="px-4 py-3 text-xs text-slate-500">
                                    {formatDateTime(
                                      repayment.paidAt
                                    )}
                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

                {/* HISTORY */}

                {selectedLoan.history?.length >
                  0 && (
                  <div>

                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Loan History
                    </h3>

                    <div className="space-y-2">

                      {selectedLoan.history.map(
                        (item) => (
                          <div
                            key={
                              item._id
                            }
                            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                          >

                            <div className="flex flex-wrap items-center justify-between gap-2">

                              <p className="text-sm font-medium text-slate-800">
                                {
                                  item.action
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                {formatDateTime(
                                  item.createdAt
                                )}
                              </p>

                            </div>

                            {item.comment && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  item.comment
                                }
                              </p>
                            )}

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Loans;