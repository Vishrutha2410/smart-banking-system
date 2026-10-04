import { useEffect, useState } from "react";

import {
  FiPlus,
  FiFileText,
  FiBookOpen,
  FiEye,
  FiX,
  FiCalendar,
  FiCreditCard,
  FiPercent,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  getLoans,
  applyForLoan,
  getLoanById,
  getLoanRepayments,
  payLoanRepayment,
} from "../services/loanService";

import api from "../services/api";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

// ======================================================
// LOAN TYPES
// ======================================================

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

const BUSINESS_LOAN_TYPES = [
  "Business Loan",
  "Emergency Loan",
];

// ======================================================
// INTEREST RATES
// ======================================================

const INTEREST_RATES = {
  "Personal Loan": 12,
  "Education Loan": 8,
  "Home Loan": 7,
  "Vehicle Loan": 9,
  "Emergency Loan": 13,
  "Business Loan": 10,
};

// ======================================================
// EMI CALCULATOR
// ======================================================

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

// ======================================================
// STATUS STYLES
// ======================================================

const STATUS_STYLES = {
  PENDING:
    "bg-amber-50 text-amber-700",

  APPROVED:
    "bg-emerald-50 text-emerald-700",

  REJECTED:
    "bg-red-50 text-red-700",

  ACTIVE:
    "bg-brand-50 text-brand-700",

  REPAYMENT:
    "bg-blue-50 text-blue-700",

  OVERDUE:
    "bg-red-50 text-red-700",

  COMPLETED:
    "bg-slate-100 text-slate-500",

  CLOSED:
    "bg-slate-100 text-slate-500",

  Pending:
    "bg-amber-50 text-amber-700",

  Approved:
    "bg-emerald-50 text-emerald-700",

  Rejected:
    "bg-red-50 text-red-700",

  Active:
    "bg-brand-50 text-brand-700",

  Repayment:
    "bg-blue-50 text-blue-700",

  Overdue:
    "bg-red-50 text-red-700",

  Completed:
    "bg-slate-100 text-slate-500",

  Closed:
    "bg-slate-100 text-slate-500",
};

// ======================================================
// REPAYMENT STATUS STYLES
// ======================================================

const REPAYMENT_STATUS_STYLES = {
  PAID:
    "bg-emerald-50 text-emerald-700",

  PENDING:
    "bg-amber-50 text-amber-700",

  OVERDUE:
    "bg-red-50 text-red-700",

  PARTIAL:
    "bg-blue-50 text-blue-700",
};

// ======================================================
// FORMAT HELPERS
// ======================================================

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

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
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

// ======================================================
// GET ACCOUNT ID
// ======================================================

const getAccountId = (account) => {
  if (!account) {
    return "";
  }

  if (typeof account === "string") {
    return account;
  }

  return (
    account._id ||
    account.id ||
    ""
  );
};

// ======================================================
// LOANS PAGE
// ======================================================

const Loans = () => {
  const { user } = useAuth();

  // ======================================================
  // CUSTOMER TYPE
  // ======================================================

  const customerType =
    String(
      user?.customerType || "personal"
    )
      .trim()
      .toLowerCase();

  const isStudent =
    customerType === "student";

  const isBusiness =
    customerType === "business";

  const LOAN_TYPES = isStudent
    ? STUDENT_LOAN_TYPES
    : isBusiness
      ? BUSINESS_LOAN_TYPES
      : PERSONAL_LOAN_TYPES;

  const defaultLoanType = isStudent
    ? "Education Loan"
    : isBusiness
      ? "Business Loan"
      : "Personal Loan";

  // ======================================================
  // STATE
  // ======================================================

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

  const [repayments, setRepayments] =
    useState([]);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [paymentAccountId, setPaymentAccountId] =
    useState("");

  const [payingEMI, setPayingEMI] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentSuccess, setPaymentSuccess] =
    useState("");

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

  // ======================================================
  // KEEP LOAN TYPE CORRECT
  // ======================================================

  useEffect(() => {
    setForm((previous) => ({
      ...previous,

      loanType: LOAN_TYPES.includes(
        previous.loanType
      )
        ? previous.loanType
        : defaultLoanType,
    }));
  }, [
    customerType,
    defaultLoanType,
  ]);

  // ======================================================
  // LOAD LOANS
  // ======================================================

  const load = async () => {
    setStatus("loading");

    try {
      const data = await getLoans();

      const loanList =
        Array.isArray(data)
          ? data
          : [];

      const visibleLoans = isStudent
        ? loanList.filter(
            (loan) =>
              loan?.loanType ===
              "Education Loan"
          )
        : isBusiness
          ? loanList.filter(
              (loan) =>
                loan?.loanType ===
                "Business Loan"
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

  // ======================================================
  // LOAD USER ACCOUNTS
  // ======================================================

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

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    load();
    loadAccounts();
  }, [
    isStudent,
    isBusiness,
  ]);

  // ======================================================
  // OPEN LOAN DETAILS
  // ======================================================

  const handleViewDetails = async (
    loan
  ) => {
    setSelectedLoan(loan);

    setRepayments([]);

    setLoadingDetails(true);

    setPaymentError("");

    setPaymentSuccess("");

    const loanId =
      loan?._id;

    if (!loanId) {
      setLoadingDetails(false);
      return;
    }

    try {
      // --------------------------------------------------
      // Get complete loan details
      // --------------------------------------------------

      const response =
        await getLoanById(
          loanId
        );

      const detailedLoan =
        response?.loan ||
        response?.data?.loan ||
        response?.data ||
        loan;

      const schedule =
        Array.isArray(
          response?.repayments
        )
          ? response.repayments
          : [];

      setSelectedLoan(
        detailedLoan
      );

      setRepayments(
        schedule
      );

      // --------------------------------------------------
      // Set default payment account
      // --------------------------------------------------

      const loanAccountId =
        getAccountId(
          detailedLoan?.account
        );

      if (loanAccountId) {
        setPaymentAccountId(
          loanAccountId
        );
      } else if (
        accounts.length > 0
      ) {
        const activeAccount =
          accounts.find(
            (account) =>
              String(
                account.status
              ).toLowerCase() ===
              "active"
          ) || accounts[0];

        setPaymentAccountId(
          activeAccount?._id || ""
        );
      }

      // --------------------------------------------------
      // If schedule was not returned,
      // explicitly fetch it.
      // --------------------------------------------------

      if (
        schedule.length === 0 &&
        detailedLoan?.disbursedDate
      ) {
        try {
          const repaymentResponse =
            await getLoanRepayments(
              loanId
            );

          const repaymentList =
            repaymentResponse?.repayments ||
            repaymentResponse?.data?.repayments ||
            [];

          if (
            Array.isArray(
              repaymentList
            )
          ) {
            setRepayments(
              repaymentList
            );
          }
        } catch (scheduleError) {
          console.error(
            "[Loans] Failed to load repayment schedule:",
            scheduleError
          );
        }
      }
    } catch (err) {
      console.error(
        "[Loans] Failed to load loan details:",
        err
      );

      // Keep the existing loan visible
      setSelectedLoan(loan);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ======================================================
  // CLOSE LOAN DETAILS
  // ======================================================

  const handleCloseDetails = () => {
    if (payingEMI) {
      return;
    }

    setSelectedLoan(null);

    setRepayments([]);

    setPaymentAccountId("");

    setPaymentError("");

    setPaymentSuccess("");
  };

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
  // REPAYMENT CALCULATIONS
  // ======================================================

  const unpaidRepayments =
    Array.isArray(repayments)
      ? repayments.filter(
          (item) =>
            String(
              item?.status || ""
            ).toUpperCase() !==
            "PAID"
        )
      : [];

  const nextRepayment =
    unpaidRepayments.length > 0
      ? unpaidRepayments[0]
      : null;

  const nextAmountDue =
    nextRepayment
      ? Math.max(
          0,
          Number(
            nextRepayment.amountDue
          ) -
            Number(
              nextRepayment.amountPaid ||
                0
            )
        )
      : 0;

  const totalPaid =
    selectedLoan?.totalPaidAmount ??
    (Array.isArray(repayments)
      ? repayments.reduce(
          (sum, item) =>
            sum +
            Number(
              item?.amountPaid || 0
            ),
          0
        )
      : 0);

  const remainingAmount =
    selectedLoan?.remainingAmount ??
    (Array.isArray(repayments)
      ? repayments.reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              Number(
                item?.amountDue || 0
              ) -
                Number(
                  item?.amountPaid || 0
                )
            ),
          0
        )
      : 0);

  const paidInstallments =
    selectedLoan?.paidInstallments ??
    (Array.isArray(repayments)
      ? repayments.filter(
          (item) =>
            String(
              item?.status || ""
            ).toUpperCase() ===
            "PAID"
        ).length
      : 0);

  const overdueAmount =
    selectedLoan?.overdueAmount ??
    (Array.isArray(repayments)
      ? repayments
          .filter(
            (item) =>
              String(
                item?.status || ""
              ).toUpperCase() ===
              "OVERDUE"
          )
          .reduce(
            (sum, item) =>
              sum +
              Math.max(
                0,
                Number(
                  item?.amountDue || 0
                ) -
                  Number(
                    item?.amountPaid || 0
                  )
              ),
            0
          )
      : 0);

  const nextDueDate =
    selectedLoan?.nextDueDate ||
    nextRepayment?.dueDate ||
    null;

  // ======================================================
  // CAN USER PAY EMI?
  // ======================================================

  const selectedLoanStatus =
    String(
      selectedLoan?.status || ""
    ).toUpperCase();

  const canPayEMI =
    [
      "ACTIVE",
      "REPAYMENT",
      "OVERDUE",
    ].includes(
      selectedLoanStatus
    ) &&
    Boolean(
      nextRepayment
    ) &&
    nextAmountDue > 0;

  // ======================================================
  // PAY EMI
  // ======================================================

  const handlePayEMI = async () => {
    setPaymentError("");

    setPaymentSuccess("");

    if (!selectedLoan?._id) {
      setPaymentError(
        "Loan information is not available."
      );

      return;
    }

    if (!canPayEMI) {
      setPaymentError(
        "This loan does not currently have an EMI available for payment."
      );

      return;
    }

    if (!paymentAccountId) {
      setPaymentError(
        "Please select a payment account."
      );

      return;
    }

    const paymentAccount =
      accounts.find(
        (account) =>
          String(account._id) ===
          String(paymentAccountId)
      );

    if (!paymentAccount) {
      setPaymentError(
        "Selected payment account could not be found."
      );

      return;
    }

    const availableBalance =
      Number(
        paymentAccount.balance || 0
      );

    if (
      availableBalance <
      nextAmountDue
    ) {
      setPaymentError(
        `Insufficient balance. Available balance is ₹${formatCurrency(
          availableBalance
        )}.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Pay EMI of ₹${formatCurrency(
          nextAmountDue
        )} from account ${paymentAccount.accountNumber}?`
      );

    if (!confirmed) {
      return;
    }

    setPayingEMI(true);

    try {
      const response =
        await payLoanRepayment(
          selectedLoan._id,
          paymentAccountId
        );

      setPaymentSuccess(
        response?.message ||
          "Loan EMI paid successfully."
      );

      setPaymentError("");

      // --------------------------------------------------
      // Refresh loan list
      // --------------------------------------------------

      await load();

      // --------------------------------------------------
      // Refresh complete loan details
      // --------------------------------------------------

      const detailResponse =
        await getLoanById(
          selectedLoan._id
        );

      const updatedLoan =
        detailResponse?.loan ||
        detailResponse?.data?.loan ||
        selectedLoan;

      let updatedRepayments =
        Array.isArray(
          detailResponse?.repayments
        )
          ? detailResponse.repayments
          : [];

      // --------------------------------------------------
      // Fallback repayment schedule request
      // --------------------------------------------------

      if (
        updatedRepayments.length === 0 &&
        updatedLoan?.disbursedDate
      ) {
        try {
          const repaymentResponse =
            await getLoanRepayments(
              selectedLoan._id
            );

          updatedRepayments =
            repaymentResponse?.repayments ||
            repaymentResponse?.data?.repayments ||
            [];
        } catch (scheduleError) {
          console.error(
            "[Loans] Failed to refresh repayment schedule:",
            scheduleError
          );
        }
      }

      setSelectedLoan(
        updatedLoan
      );

      setRepayments(
        Array.isArray(
          updatedRepayments
        )
          ? updatedRepayments
          : []
      );

      // --------------------------------------------------
      // Keep selected payment account
      // --------------------------------------------------

      setPaymentAccountId(
        paymentAccountId
      );
    } catch (err) {
      console.error(
        "[Loans] EMI payment failed:",
        err
      );

      setPaymentSuccess("");

      setPaymentError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not pay the EMI. Please try again."
      );
    } finally {
      setPayingEMI(false);
    }
  };

  // ======================================================
  // SUBMIT LOAN APPLICATION
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (
      isBusiness &&
      form.loanType !==
        "Business Loan"
    ) {
      setFormError(
        "Business customers can apply only for a Business Loan."
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
            : isBusiness
              ? "Business Loan"
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
            : isBusiness
              ? "Business Loan"
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

      await load();
    } catch (err) {
      console.error(
        "[Loans] Failed to submit loan:",
        err
      );

      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not submit loan application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // LOADING / ERROR STATES
  // ======================================================

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

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isStudent && (
              <FiBookOpen className="h-5 w-5 text-brand-600" />
            )}

            <h1 className="text-2xl font-bold text-slate-900">
              {isStudent
                ? "Education Loans"
                : isBusiness
                  ? "Business Loans"
                  : "Loans"}
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {isStudent
              ? "Apply for and track your education loan applications."
              : isBusiness
                ? "Apply for and track your business loan applications."
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
            : isBusiness
              ? "Apply for Business Loan"
              : "Apply for Loan"}
        </button>
      </div>

      {/* ==================================================
          STUDENT INFORMATION
      ================================================== */}

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

      {/* ==================================================
          LOAN LIST
      ================================================== */}

      {!Array.isArray(loans) ||
      loans.length === 0 ? (
        <EmptyState
          title={
            isStudent
              ? "No education loan applications yet"
              : isBusiness
                ? "No business loan applications yet"
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

                <th className="px-4 py-3 text-center">
                  Action
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
                    className="hover:bg-slate-50"
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
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusClass
                        }`}
                      >
                        {formatStatus(
                          statusValue
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(
                        appliedDate
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewDetails(
                            loan
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <FiEye className="h-3.5 w-3.5" />

                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================
          LOAN DETAILS MODAL
      ================================================== */}

      {selectedLoan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* ==================================================
                DETAILS HEADER
            ================================================== */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Loan Details
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedLoan.loanId
                    ? `Loan ID: ${selectedLoan.loanId}`
                    : "Application details"}
                </p>
              </div>

              {/* ONLY X BUTTON */}

              <button
                type="button"
                onClick={
                  handleCloseDetails
                }
                disabled={payingEMI}
                aria-label="Close loan details"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* ==================================================
                DETAILS CONTENT
            ================================================== */}

            <div className="space-y-5 p-5">
              {/* ==================================================
                  STATUS
              ================================================== */}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Application Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatStatus(
                      selectedLoan.status ||
                        "PENDING"
                    )}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    STATUS_STYLES[
                      selectedLoan.status
                    ] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {formatStatus(
                    selectedLoan.status ||
                      "PENDING"
                  )}
                </span>
              </div>

              {/* ==================================================
                  LOADING DETAILS
              ================================================== */}

              {loadingDetails && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Loading loan repayment details...
                </div>
              )}

              {/* ==================================================
                  BASIC LOAN INFORMATION
              ================================================== */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Loan Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={FiFileText}
                    label="Loan Type"
                    value={
                      selectedLoan.loanType ||
                      "Loan"
                    }
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Loan ID"
                    value={
                      selectedLoan.loanId ||
                      selectedLoan._id ||
                      "-"
                    }
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Requested Amount"
                    value={`₹${formatCurrency(
                      selectedLoan.requestedAmount ??
                        selectedLoan.amount ??
                        0
                    )}`}
                  />

                  <DetailItem
                    icon={FiPercent}
                    label="Interest Rate"
                    value={`${
                      selectedLoan.interestRate ??
                      0
                    }% p.a.`}
                  />

                  <DetailItem
                    icon={FiClock}
                    label="Tenure"
                    value={`${
                      selectedLoan.tenureMonths ??
                      selectedLoan.tenure ??
                      0
                    } months`}
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Monthly EMI"
                    value={`₹${formatCurrency(
                      selectedLoan.monthlyPayment
                    )}`}
                  />
                </div>
              </div>

              {/* ==================================================
                  ELIGIBILITY INFORMATION
              ================================================== */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Eligibility Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={FiCreditCard}
                    label="Eligible Limit"
                    value={`₹${formatCurrency(
                      selectedLoan.eligibleLimit
                    )}`}
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Monthly Income"
                    value={`₹${formatCurrency(
                      selectedLoan.monthlyIncome
                    )}`}
                  />

                  <DetailItem
                    icon={FiCheckCircle}
                    label="Credit Score"
                    value={
                      selectedLoan.creditScore ??
                      "-"
                    }
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Existing Loan Amount"
                    value={`₹${formatCurrency(
                      selectedLoan.existingLoanAmount
                    )}`}
                  />
                </div>
              </div>

              {/* ==================================================
                  ACCOUNT INFORMATION
              ================================================== */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Account Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={FiCreditCard}
                    label="Account Number"
                    value={
                      selectedLoan.account
                        ?.accountNumber ||
                      "-"
                    }
                  />

                  <DetailItem
                    icon={FiCreditCard}
                    label="Account Type"
                    value={
                      selectedLoan.account
                        ?.accountType ||
                      "-"
                    }
                  />

                  <DetailItem
                    icon={FiDollarSign}
                    label="Account Balance"
                    value={`₹${formatCurrency(
                      selectedLoan.account
                        ?.balance
                    )}`}
                  />

                  <DetailItem
                    icon={FiCheckCircle}
                    label="Account Status"
                    value={
                      selectedLoan.account
                        ?.status ||
                      "-"
                    }
                  />
                </div>
              </div>

              {/* ==================================================
                  APPLICATION INFORMATION
              ================================================== */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Application Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={FiCalendar}
                    label="Applied Date"
                    value={formatDate(
                      selectedLoan.createdAt ??
                        selectedLoan.appliedDate
                    )}
                  />

                  <DetailItem
                    icon={FiCalendar}
                    label="Updated Date"
                    value={formatDate(
                      selectedLoan.updatedAt
                    )}
                  />

                  <DetailItem
                    icon={FiCalendar}
                    label="Disbursed Date"
                    value={formatDate(
                      selectedLoan.disbursedDate
                    )}
                  />

                  <DetailItem
                    icon={FiCalendar}
                    label="Next Due Date"
                    value={formatDate(
                      nextDueDate
                    )}
                  />
                </div>
              </div>

              {/* ==================================================
                  PURPOSE
              ================================================== */}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  Purpose
                </h3>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedLoan.purpose ||
                      "No purpose provided."}
                  </p>
                </div>
              </div>

              {/* ==================================================
                  REPAYMENT SECTION
              ================================================== */}

              {selectedLoan.disbursedDate && (
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Loan Repayment
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Track your EMI payments and
                      repay the next installment from
                      your bank account.
                    </p>
                  </div>

                  {/* ==================================================
                      REPAYMENT SUMMARY
                  ================================================== */}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                      label="Total Paid"
                      value={`₹${formatCurrency(
                        totalPaid
                      )}`}
                      valueClass="text-emerald-600"
                    />

                    <SummaryCard
                      label="Remaining"
                      value={`₹${formatCurrency(
                        remainingAmount
                      )}`}
                    />

                    <SummaryCard
                      label="Paid EMIs"
                      value={`${paidInstallments} / ${
                        selectedLoan.tenureMonths ||
                        repayments.length ||
                        0
                      }`}
                    />

                    <SummaryCard
                      label="Overdue"
                      value={`₹${formatCurrency(
                        overdueAmount
                      )}`}
                      valueClass={
                        overdueAmount > 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }
                    />
                  </div>

                  {/* ==================================================
                      PAYMENT ERROR
                  ================================================== */}

                  {paymentError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                      <span>
                        {paymentError}
                      </span>
                    </div>
                  )}

                  {/* ==================================================
                      PAYMENT SUCCESS
                  ================================================== */}

                  {paymentSuccess && (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />

                      <span>
                        {paymentSuccess}
                      </span>
                    </div>
                  )}

                  {/* ==================================================
                      PAY EMI CARD
                  ================================================== */}

                  {canPayEMI ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-blue-900">
                              Next EMI
                            </p>

                            <p className="mt-1 text-xs text-blue-700">
                              Installment #
                              {
                                nextRepayment.installmentNumber
                              }{" "}
                              • Due{" "}
                              {formatDate(
                                nextRepayment.dueDate
                              )}
                            </p>
                          </div>

                          <p className="text-xl font-bold text-blue-900">
                            ₹
                            {formatCurrency(
                              nextAmountDue
                            )}
                          </p>
                        </div>

                        {/* Payment Account */}

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-blue-900">
                            Pay EMI From
                          </label>

                          <select
                            value={
                              paymentAccountId
                            }
                            onChange={(e) =>
                              setPaymentAccountId(
                                e.target.value
                              )
                            }
                            disabled={payingEMI}
                            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                          >
                            <option value="">
                              Select Payment Account
                            </option>

                            {accounts
                              .filter(
                                (account) =>
                                  String(
                                    account.status
                                  ).toLowerCase() ===
                                  "active"
                              )
                              .map(
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
                                      account.accountType
                                    }{" "}
                                    -{" "}
                                    {
                                      account.accountNumber
                                    }{" "}
                                    - Balance ₹
                                    {formatCurrency(
                                      account.balance
                                    )}
                                  </option>
                                )
                              )}
                          </select>
                        </div>

                        {/* Pay Button */}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs text-blue-700">
                            {nextRepayment.status ===
                            "OVERDUE" ? (
                              <span className="font-medium text-red-600">
                                This EMI is overdue.
                                Please make the payment
                                to update your loan.
                              </span>
                            ) : (
                              "The EMI will be deducted from the selected account."
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={
                              handlePayEMI
                            }
                            disabled={
                              payingEMI ||
                              !paymentAccountId
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FiDollarSign className="h-4 w-4" />

                            {payingEMI
                              ? "Processing..."
                              : `Pay EMI ₹${formatCurrency(
                                  nextAmountDue
                                )}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      {selectedLoanStatus ===
                      "APPROVED" ? (
                        <>
                          <p className="text-sm font-semibold text-slate-800">
                            Loan approved
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your loan has been approved,
                            but repayment will become
                            available after the loan is
                            disbursed by the admin.
                          </p>
                        </>
                      ) : selectedLoanStatus ===
                        "PENDING" ? (
                        <>
                          <p className="text-sm font-semibold text-slate-800">
                            Loan application pending
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            EMI repayment will become
                            available after your loan is
                            approved and disbursed.
                          </p>
                        </>
                      ) : selectedLoanStatus ===
                        "REJECTED" ? (
                        <>
                          <p className="text-sm font-semibold text-red-700">
                            Loan application rejected
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            This loan is not available
                            for repayment.
                          </p>
                        </>
                      ) : selectedLoanStatus ===
                        "CLOSED" ||
                        selectedLoanStatus ===
                          "COMPLETED" ? (
                        <>
                          <p className="text-sm font-semibold text-emerald-700">
                            Loan completed
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            All installments for this
                            loan have been paid.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-800">
                            No EMI available
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            There is currently no unpaid
                            installment available for
                            payment.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* ==================================================
                      REPAYMENT SCHEDULE
                  ================================================== */}

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Repayment Schedule
                      </h3>

                      <span className="text-xs text-slate-500">
                        {repayments.length} installment
                        {repayments.length === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    {repayments.length ===
                    0 ? (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                        <p className="text-sm text-slate-500">
                          Repayment schedule is not
                          available yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
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

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {repayments.map(
                              (
                                repayment,
                                index
                              ) => {
                                const repaymentStatus =
                                  String(
                                    repayment?.status ||
                                      "PENDING"
                                  ).toUpperCase();

                                const statusClass =
                                  REPAYMENT_STATUS_STYLES[
                                    repaymentStatus
                                  ] ||
                                  "bg-slate-100 text-slate-600";

                                return (
                                  <tr
                                    key={
                                      repayment._id ||
                                      `${selectedLoan._id}-${index}`
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                      #
                                      {repayment.installmentNumber ||
                                        index +
                                          1}
                                    </td>

                                    <td className="px-4 py-3 text-slate-600">
                                      {formatDate(
                                        repayment.dueDate
                                      )}
                                    </td>

                                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                                      ₹
                                      {formatCurrency(
                                        repayment.amountDue
                                      )}
                                    </td>

                                    <td className="px-4 py-3 text-right text-emerald-600">
                                      ₹
                                      {formatCurrency(
                                        repayment.amountPaid
                                      )}
                                    </td>

                                    <td className="px-4 py-3">
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
                                      >
                                        {formatStatus(
                                          repaymentStatus
                                        )}
                                      </span>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          APPLY LOAN MODAL
      ================================================== */}

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
                    : isBusiness
                      ? "Apply for Business Loan"
                      : "Apply for Loan"}
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {isStudent
                  ? "Complete the details below for your education loan application."
                  : isBusiness
                    ? "Complete the details below for your business loan application."
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
                    setShowModal(false);
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

// ======================================================
// REUSABLE LOAN DETAIL ITEM
// ======================================================

const DetailItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-medium text-slate-800">
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// REPAYMENT SUMMARY CARD
// ======================================================

const SummaryCard = ({
  label,
  value,
  valueClass = "text-slate-900",
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-base font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
};

export default Loans;