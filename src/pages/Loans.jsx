import { useEffect, useState } from "react";
import {
  FiPlus,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import {
  getLoans,
  applyForLoan,
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

const calculateEMI = (
  principal,
  annualRatePercent,
  tenureMonths
) => {
  const monthlyRate =
    annualRatePercent / 12 / 100;

  if (!principal || !tenureMonths) {
    return 0;
  }

  if (monthlyRate === 0) {
    return Math.round(
      principal / tenureMonths
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

const STATUS_STYLES = {
  PENDING:
    "bg-amber-50 text-amber-700",
  APPROVED:
    "bg-emerald-50 text-emerald-700",
  REJECTED:
    "bg-red-50 text-red-700",
  ACTIVE:
    "bg-brand-50 text-brand-700",
  COMPLETED:
    "bg-slate-100 text-slate-500",

  Pending:
    "bg-amber-50 text-amber-700",
  Approved:
    "bg-emerald-50 text-emerald-700",
  Rejected:
    "bg-red-50 text-red-700",
  Active:
    "bg-brand-50 text-brand-700",
  Completed:
    "bg-slate-100 text-slate-500",
};

const formatStatus = (status = "") => {
  const value =
    String(status).toLowerCase();

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

const formatCurrency = (value) => {
  const number = Number(value) || 0;

  return number.toLocaleString("en-IN");
};

const Loans = () => {
  const { user } = useAuth();

  const customerType =
    String(
      user?.customerType || "personal"
    )
      .trim()
      .toLowerCase();

  const isStudent =
    customerType === "student";

  const LOAN_TYPES = isStudent
    ? STUDENT_LOAN_TYPES
    : PERSONAL_LOAN_TYPES;

  const defaultLoanType = isStudent
    ? "Education Loan"
    : "Personal Loan";

  const [loans, setLoans] = useState([]);

  const [accounts, setAccounts] =
    useState([]);

  const [status, setStatus] =
    useState("loading");

  const [showModal, setShowModal] =
    useState(false);

  const [form, setForm] = useState({
    loanType: defaultLoanType,
    accountId: "",
    amount: "",
    monthlyIncome: "",
    creditScore: "",
    existingLoanAmount: "0",
    tenure: "12",
    purpose: "",
  });

  const [formError, setFormError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  // -----------------------------------------
  // Keep loan type correct if customer type
  // changes or user data finishes loading.
  // -----------------------------------------
  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      loanType:
        isStudent &&
        previous.loanType !==
          "Education Loan"
          ? "Education Loan"
          : !isStudent &&
              !PERSONAL_LOAN_TYPES.includes(
                previous.loanType
              )
            ? "Personal Loan"
            : previous.loanType,
    }));
  }, [isStudent]);

  // -----------------------------------------
  // Load loans
  // -----------------------------------------
  const load = async () => {
    setStatus("loading");

    try {
      const data = await getLoans();

      const loanList = Array.isArray(data)
        ? data
        : [];

      // Students should only see education
      // loan applications in their student flow.
      const visibleLoans = isStudent
        ? loanList.filter(
            (loan) =>
              loan?.loanType ===
              "Education Loan"
          )
        : loanList;

      setLoans(visibleLoans);

      setStatus("success");
    } catch (err) {
      console.error(
        "[Loans] Failed to load loans:",
        err
      );

      setLoans([]);
      setStatus("error");
    }
  };

  // -----------------------------------------
  // Load user's accounts
  // -----------------------------------------
  const loadAccounts = async () => {
    try {
      const response =
        await api.get("/accounts");

      const data =
        response.data?.accounts ||
        response.data?.data ||
        response.data;

      const accountList =
        Array.isArray(data)
          ? data
          : [];

      setAccounts(accountList);

      // Automatically select first active account
      if (accountList.length > 0) {
        const activeAccount =
          accountList.find(
            (account) =>
              String(
                account.status
              ).toLowerCase() ===
              "active"
          ) || accountList[0];

        setForm((previous) => ({
          ...previous,
          accountId:
            previous.accountId ||
            activeAccount._id,
        }));
      }
    } catch (err) {
      console.error(
        "[Loans] Failed to load accounts:",
        err
      );

      setAccounts([]);
    }
  };

  useEffect(() => {
    load();
    loadAccounts();
  }, [isStudent]);

  // -----------------------------------------
  // EMI preview
  // -----------------------------------------
  const previewEMI =
    calculateEMI(
      Number(form.amount) || 0,
      INTEREST_RATES[
        form.loanType
      ] || 10,
      Number(form.tenure) || 1
    );

  // -----------------------------------------
  // Submit loan application
  // -----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    // Extra frontend protection.
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

    const numericAmount =
      Number(form.amount);

    const numericTenure =
      Number(form.tenure);

    const numericIncome =
      Number(form.monthlyIncome);

    const numericCreditScore =
      Number(form.creditScore);

    const numericExistingLoan =
      Number(
        form.existingLoanAmount
      ) || 0;

    if (!form.accountId) {
      setFormError(
        "Please select an account for the loan."
      );

      return;
    }

    if (
      !numericAmount ||
      numericAmount < 1000
    ) {
      setFormError(
        "Loan amount must be at least ₹1,000."
      );

      return;
    }

    if (
      !numericIncome ||
      numericIncome <= 0
    ) {
      setFormError(
        "Please enter your monthly income."
      );

      return;
    }

    if (
      form.creditScore === "" ||
      numericCreditScore < 0
    ) {
      setFormError(
        "Please enter a valid credit score."
      );

      return;
    }

    if (
      !numericTenure ||
      numericTenure < 1
    ) {
      setFormError(
        "Tenure must be at least 1 month."
      );

      return;
    }

    setSubmitting(true);

    try {
      const loanData = {
        loanType:
          isStudent
            ? "Education Loan"
            : form.loanType,

        accountId:
          form.accountId,

        requestedAmount:
          numericAmount,

        monthlyIncome:
          numericIncome,

        creditScore:
          numericCreditScore,

        existingLoanAmount:
          numericExistingLoan,

        tenureMonths:
          numericTenure,

        purpose:
          form.purpose,
      };

      const loan =
        await applyForLoan(
          loanData
        );

      // applyForLoan returns the actual
      // loan object.
      if (
        loan &&
        typeof loan === "object"
      ) {
        if (
          !isStudent ||
          loan.loanType ===
            "Education Loan"
        ) {
          setLoans((previous) => [
            loan,
            ...(Array.isArray(
              previous
            )
              ? previous
              : []),
          ]);
        }
      }

      setShowModal(false);

      setForm({
        loanType:
          isStudent
            ? "Education Loan"
            : "Personal Loan",

        accountId:
          accounts.length > 0
            ? (
                accounts.find(
                  (account) =>
                    String(
                      account.status
                    ).toLowerCase() ===
                    "active"
                ) ||
                accounts[0]
              )._id
            : "",

        amount: "",
        monthlyIncome: "",
        creditScore: "",
        existingLoanAmount: "0",
        tenure: "12",
        purpose: "",
      });

      // Reload from backend so the UI
      // reflects MongoDB data.
      await load();
    } catch (err) {
      console.error(
        "[Loans] Failed to submit loan:",
        err
      );

      setFormError(
        err?.message ||
          "Could not submit loan application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // Loading / error states
  // -----------------------------------------
  if (status === "loading") {
    return (
      <Loader label="Loading loans..." />
    );
  }

  if (status === "error") {
    return (
      <ErrorState onRetry={load} />
    );
  }

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="space-y-6">

      {/* Header */}
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
              ? "Apply for and track your education loan applications."
              : "Apply for and track your loan applications."}
          </p>
        </div>

        <button
          onClick={() => {
            setFormError("");

            setForm((previous) => ({
              ...previous,
              loanType:
                isStudent
                  ? "Education Loan"
                  : previous.loanType,
            }));

            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus />

          {isStudent
            ? "Apply for Education Loan"
            : "Apply for Loan"}
        </button>
      </div>

      {/* Student information */}
      {isStudent && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <FiBookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Student Education Loan
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Your student account is eligible
              for the Education Loan flow.
              Education loans currently use
              an interest rate of 8% p.a.
            </p>
          </div>
        </div>
      )}

      {/* Loan List */}
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
                  Type
                </th>

                <th className="px-4 py-3 text-right">
                  Amount
                </th>

                <th className="px-4 py-3">
                  Interest
                </th>

                <th className="px-4 py-3">
                  Tenure
                </th>

                <th className="px-4 py-3 text-right">
                  Monthly Payment
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Applied
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loans.map((loan) => {
                const amount =
                  loan.requestedAmount ??
                  loan.amount ??
                  0;

                const tenure =
                  loan.tenureMonths ??
                  loan.tenure ??
                  0;

                const appliedDate =
                  loan.createdAt ??
                  loan.appliedDate;

                const statusValue =
                  loan.status ||
                  "PENDING";

                const statusClass =
                  STATUS_STYLES[
                    statusValue
                  ] ||
                  "bg-slate-100 text-slate-600";

                return (
                  <tr
                    key={
                      loan._id ||
                      loan.loanId
                    }
                  >
                    <td className="px-4 py-3 text-slate-800">
                      {loan.loanType ||
                        "Loan"}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹
                      {formatCurrency(
                        amount
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {loan.interestRate ??
                        0}
                      %
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {tenure} mo
                    </td>

                    <td className="px-4 py-3 text-right text-slate-800">
                      ₹
                      {formatCurrency(
                        loan.monthlyPayment
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
                      >
                        {formatStatus(
                          statusValue
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {appliedDate
                        ? new Date(
                            appliedDate
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Loan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">

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
                {isStudent
                  ? "Complete the details below for your education loan application."
                  : "Complete the details below for your loan application."}
              </p>
            </div>

            {isStudent && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-800">
                <p className="font-semibold">
                  Education Loan
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  As a student customer, only
                  Education Loan applications
                  are available.
                </p>
              </div>
            )}

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4"
            >

              {/* Account */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Account
                </label>

                <select
                  value={form.accountId}
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        accountId:
                          e.target.value,
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

              {/* Loan Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Loan Type
                </label>

                <select
                  value={form.loanType}
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        loanType:
                          e.target.value,
                      })
                    )
                  }
                  disabled={isStudent}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600"
                >
                  {LOAN_TYPES.map(
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

              {/* Amount */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Requested Amount
                </label>

                <input
                  type="number"
                  min="1000"
                  value={form.amount}
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        amount:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 200000"
                />
              </div>

              {/* Monthly Income */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monthly Income
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    form.monthlyIncome
                  }
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        monthlyIncome:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Credit Score */}
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
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        creditScore:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 750"
                />
              </div>

              {/* Existing Loan */}
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
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        existingLoanAmount:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Tenure */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tenure (months)
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.tenure}
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        tenure:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isStudent
                    ? "Education Purpose"
                    : "Purpose"}{" "}
                  (optional)
                </label>

                <input
                  value={form.purpose}
                  onChange={(e) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        purpose:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={
                    isStudent
                      ? "e.g. Tuition fees, hostel, books"
                      : "What is the loan for?"
                  }
                />
              </div>

              {/* EMI */}
              {Number(form.amount) >
                0 && (
                <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Estimated EMI:{" "}
                  <span className="font-semibold">
                    ₹
                    {previewEMI.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                  /month
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(
                      false
                    );

                    setFormError("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Applying..."
                    : "Submit Application"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;