import { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiCheckCircle,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
  FiShield,
  FiX,
  FiLock,
} from "react-icons/fi";

import {
  getAccounts,
  getBanks,
  createAccount,
  creditAccount,
  debitAccount,
} from "../services/accountService";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

/* =========================================================
   CONSTANTS
========================================================= */

const ACCOUNT_TYPES = [
  "Savings",
  "Current",
  "Salary",
];

/* =========================================================
   HELPERS
========================================================= */

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
};

const getBankKey = (bank) => {
  if (!bank) return "";

  return String(
    bank._id ||
      bank.bankId ||
      bank.shortName ||
      bank.bankName ||
      ""
  );
};

const resolveBank = (account, banks) => {
  if (!account) return null;

  if (
    account.bank &&
    typeof account.bank === "object"
  ) {
    return account.bank;
  }

  if (
    typeof account.bank === "string"
  ) {
    return (
      banks.find(
        (bank) =>
          String(bank._id) === String(account.bank) ||
          String(bank.bankId) === String(account.bank)
      ) || null
    );
  }

  if (account.bankName) {
    return (
      banks.find(
        (bank) =>
          bank.bankName?.toLowerCase() ===
          account.bankName?.toLowerCase()
      ) || {
        bankName: account.bankName,
        shortName: account.shortName || "",
      }
    );
  }

  return null;
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getBankTheme = (bank) => {
  const shortName =
    bank?.shortName?.toUpperCase() || "";

  if (shortName === "SBI") {
    return {
      icon: "bg-blue-600",
      light: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      button:
        "bg-blue-600 hover:bg-blue-700",
    };
  }

  if (shortName === "HDFC") {
    return {
      icon: "bg-red-600",
      light: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      button:
        "bg-red-600 hover:bg-red-700",
    };
  }

  if (shortName === "ICICI") {
    return {
      icon: "bg-orange-500",
      light: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      button:
        "bg-orange-500 hover:bg-orange-600",
    };
  }

  if (shortName === "AXIS") {
    return {
      icon: "bg-rose-700",
      light: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      button:
        "bg-rose-700 hover:bg-rose-800",
    };
  }

  if (
    shortName === "SMB" ||
    shortName === "SMART"
  ) {
    return {
      icon: "bg-indigo-600",
      light: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-700",
      button:
        "bg-indigo-600 hover:bg-indigo-700",
    };
  }

  return {
    icon: "bg-slate-700",
    light: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    button:
      "bg-slate-700 hover:bg-slate-800",
  };
};

/* =========================================================
   MESSAGE MODAL
========================================================= */

function MessageModal({
  open,
  type = "success",
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  const isError = type === "error";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isError
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isError ? (
              <FiX size={24} />
            ) : (
              <FiCheckCircle size={24} />
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={20} />
          </button>
        </div>

        <h3 className="mt-5 text-xl font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${
            isError
              ? "bg-red-600 hover:bg-red-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MONEY MODAL
========================================================= */

function MoneyModal({
  open,
  type,
  account,
  onClose,
  onSubmit,
  loading,
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] =
    useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setError("");
    }
  }, [open]);

  if (!open || !account) return null;

  const isCredit = type === "credit";

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid amount.");
      return;
    }

    if (
      !isCredit &&
      numericAmount > Number(account.balance || 0)
    ) {
      setError("Insufficient balance.");
      return;
    }

    try {
      await onSubmit({
        amount: numericAmount,
        description,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isCredit
                ? "Credit Amount"
                : "Debit Amount"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {account.accountNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Amount
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="Enter amount"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Optional description"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isCredit
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading
              ? "Processing..."
              : isCredit
                ? "Credit Amount"
                : "Debit Amount"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Accounts() {
  const { user } = useAuth();
  const { addNotification } =
    useNotifications();

  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [moneyLoading, setMoneyLoading] =
    useState(false);

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  const [moneyType, setMoneyType] =
    useState(null);

  const [messageModal, setMessageModal] =
    useState({
      open: false,
      type: "success",
      title: "",
      message: "",
    });

  const [formError, setFormError] =
    useState("");

  const [form, setForm] = useState({
    bankId: "",
    accountType: "Savings",

    fullName: user?.name || "",
    email: user?.email || "",

    mobileNumber: "",
    dateOfBirth: "",
    gender: "",

    address: "",
    city: "",
    state: "",
    pincode: "",

    panNumber: "",
    aadhaarNumber: "",

    nomineeName: "",
    nomineeRelationship: "",
    nomineePhone: "",

    initialDeposit: "",

    transactionPin: "",
  });

  /* =======================================================
     LOAD
  ======================================================= */

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        accountsResponse,
        banksResponse,
      ] = await Promise.all([
        getAccounts(),
        getBanks(),
      ]);

      const loadedAccounts =
        Array.isArray(accountsResponse)
          ? accountsResponse
          : accountsResponse?.accounts || [];

      const loadedBanks =
        Array.isArray(banksResponse)
          ? banksResponse
          : banksResponse?.banks || [];

      setAccounts(loadedAccounts);
      setBanks(loadedBanks);
    } catch (err) {
      console.error(err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =======================================================
     USED ACCOUNT TYPES BY BANK
     
     IMPORTANT:
     This creates ONE entry per bank.
     
     Example:
     
     SBI
       Savings
       Current
     
     will still produce:
     
     SBI -> [Savings, Current]
     
     and NOT:
     
     SBI Savings
     SBI Current
     
     ======================================================= */

  const bankAccountSummary = useMemo(() => {
    const summary = new Map();

    banks.forEach((bank) => {
      summary.set(getBankKey(bank), {
        bank,
        accountTypes: [],
      });
    });

    accounts.forEach((account) => {
      const bank = resolveBank(
        account,
        banks
      );

      if (!bank) return;

      const key = getBankKey(bank);

      if (!summary.has(key)) {
        summary.set(key, {
          bank,
          accountTypes: [],
        });
      }

      const current =
        summary.get(key);

      if (
        account.accountType &&
        !current.accountTypes.includes(
          account.accountType
        )
      ) {
        current.accountTypes.push(
          account.accountType
        );
      }
    });

    return Array.from(summary.values());
  }, [banks, accounts]);

  /* =======================================================
     AVAILABLE BANKS
     
     ONE BANK ONLY.
     
     A bank is shown only if at least one of:
       Savings
       Current
       Salary
     
     is still available.
     ======================================================= */

  const availableBanks = useMemo(() => {
    return bankAccountSummary
      .map((item) => {
        const remainingTypes =
          ACCOUNT_TYPES.filter(
            (type) =>
              !item.accountTypes.includes(
                type
              )
          );

        return {
          ...item,
          remainingTypes,
        };
      })
      .filter(
        (item) =>
          item.remainingTypes.length > 0
      );
  }, [bankAccountSummary]);

  /* =======================================================
     OPEN CREATE MODAL
     ======================================================= */

  const openCreateModal = (
    bank = null,
    preferredType = null
  ) => {
    setFormError("");

    let accountType =
      preferredType || "Savings";

    if (bank) {
      const summary =
        bankAccountSummary.find(
          (item) =>
            getBankKey(item.bank) ===
            getBankKey(bank)
        );

      const remaining =
        summary?.accountTypes
          ? ACCOUNT_TYPES.filter(
              (type) =>
                !summary.accountTypes.includes(
                  type
                )
            )
          : ACCOUNT_TYPES;

      if (remaining.length === 0) {
        setMessageModal({
          open: true,
          type: "error",
          title: "Account Limit Reached",
          message: `You already have Savings, Current, and Salary accounts with ${bank.bankName}. No additional account can be created with this bank.`,
        });

        return;
      }

      if (
        !remaining.includes(accountType)
      ) {
        accountType = remaining[0];
      }
    }

    setForm((previous) => ({
      ...previous,

      bankId:
        bank?._id ||
        bank?.bankId ||
        "",

      accountType,

      fullName:
        previous.fullName ||
        user?.name ||
        "",

      email:
        previous.email ||
        user?.email ||
        "",
    }));

    setShowCreateModal(true);
  };

  /* =======================================================
     CHANGE FORM
     ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     CREATE ACCOUNT
     ======================================================= */

  const handleCreate = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");

    /* -----------------------------------------------------
       FRONTEND DUPLICATE CHECK
       ----------------------------------------------------- */

    const selectedBank = banks.find(
      (bank) =>
        String(bank._id) ===
          String(form.bankId) ||
        String(bank.bankId) ===
          String(form.bankId)
    );

    if (!selectedBank) {
      setFormError(
        "Please select a bank."
      );
      return;
    }

    const duplicate = accounts.some(
      (account) => {
        const bank = resolveBank(
          account,
          banks
        );

        if (!bank) return false;

        return (
          getBankKey(bank) ===
            getBankKey(selectedBank) &&
          account.accountType ===
            form.accountType
        );
      }
    );

    if (duplicate) {
      setMessageModal({
        open: true,
        type: "error",
        title: "Account Already Exists",
        message: `You already have a ${form.accountType} account with ${selectedBank.bankName}. You can create only one ${form.accountType} account with this bank.`,
      });

      return;
    }

    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (!form.fullName.trim()) {
      setFormError(
        "Full name is required."
      );
      return;
    }

    if (!form.email.trim()) {
      setFormError(
        "Email is required."
      );
      return;
    }

    if (!form.mobileNumber.trim()) {
      setFormError(
        "Mobile number is required."
      );
      return;
    }

    if (!/^\d{10}$/.test(
      form.mobileNumber.trim()
    )) {
      setFormError(
        "Mobile number must contain 10 digits."
      );
      return;
    }

    if (!form.pincode.trim()) {
      setFormError(
        "Pincode is required."
      );
      return;
    }

    if (!/^\d{6}$/.test(
      form.pincode.trim()
    )) {
      setFormError(
        "Pincode must contain 6 digits."
      );
      return;
    }

    if (
      form.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
        form.panNumber.trim()
      )
    ) {
      setFormError(
        "Enter a valid PAN number."
      );
      return;
    }

    if (
      form.aadhaarNumber &&
      !/^\d{12}$/.test(
        form.aadhaarNumber
          .replace(/\s/g, "")
      )
    ) {
      setFormError(
        "Aadhaar number must contain 12 digits."
      );
      return;
    }

    if (
      form.nomineePhone &&
      !/^\d{10}$/.test(
        form.nomineePhone.trim()
      )
    ) {
      setFormError(
        "Nominee phone number must contain 10 digits."
      );
      return;
    }

    if (
      !/^\d{4}$/.test(
        form.transactionPin
      )
    ) {
      setFormError(
        "Transaction PIN must contain exactly 4 digits."
      );
      return;
    }

    const deposit =
      Number(form.initialDeposit || 0);

    if (
      Number.isNaN(deposit) ||
      deposit < 0
    ) {
      setFormError(
        "Enter a valid initial deposit."
      );
      return;
    }

    try {
      setSubmitting(true);

      const created =
        await createAccount({
          ...form,

          initialDeposit:
            deposit,

          transactionPin:
            form.transactionPin,
        });

      setAccounts((previous) => [
        created,
        ...previous,
      ]);

      setShowCreateModal(false);

      setForm({
        bankId: "",
        accountType: "Savings",

        fullName:
          user?.name || "",
        email:
          user?.email || "",

        mobileNumber: "",
        dateOfBirth: "",
        gender: "",

        address: "",
        city: "",
        state: "",
        pincode: "",

        panNumber: "",
        aadhaarNumber: "",

        nomineeName: "",
        nomineeRelationship: "",
        nomineePhone: "",

        initialDeposit: "",

        transactionPin: "",
      });

      setMessageModal({
        open: true,
        type: "success",
        title: "Account Created",
        message:
          `Your ${form.accountType} account with ${selectedBank.bankName} has been created successfully.`,
      });

      addNotification?.({
        title: "Account Created",
        message: `Your ${form.accountType} account with ${selectedBank.bankName} was created successfully.`,
        type: "success",
      });

      await load();
    } catch (err) {
      console.error(err);

      const message =
        getErrorMessage(err);

      /*
       * Duplicate account from backend
       */
      if (
        err?.response?.status === 409 ||
        err?.response?.data?.code ===
          "DUPLICATE_ACCOUNT_TYPE"
      ) {
        setMessageModal({
          open: true,
          type: "error",
          title: "Account Already Exists",
          message,
        });
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     CREDIT
     ======================================================= */

  const handleCredit = async ({
    amount,
    description,
  }) => {
    if (!selectedAccount) return;

    try {
      setMoneyLoading(true);

      const updated =
        await creditAccount(
          selectedAccount._id,
          {
            amount,
            description,
          }
        );

      setAccounts((previous) =>
        previous.map((account) =>
          account._id ===
          updated._id
            ? updated
            : account
        )
      );

      setMoneyType(null);
      setSelectedAccount(null);

      setMessageModal({
        open: true,
        type: "success",
        title: "Amount Credited",
        message:
          "The amount has been credited successfully.",
      });

      await load();
    } finally {
      setMoneyLoading(false);
    }
  };

  /* =======================================================
     DEBIT
     ======================================================= */

  const handleDebit = async ({
    amount,
    description,
  }) => {
    if (!selectedAccount) return;

    try {
      setMoneyLoading(true);

      const updated =
        await debitAccount(
          selectedAccount._id,
          {
            amount,
            description,
          }
        );

      setAccounts((previous) =>
        previous.map((account) =>
          account._id ===
          updated._id
            ? updated
            : account
        )
      );

      setMoneyType(null);
      setSelectedAccount(null);

      setMessageModal({
        open: true,
        type: "success",
        title: "Amount Debited",
        message:
          "The amount has been debited successfully.",
      });

      await load();
    } finally {
      setMoneyLoading(false);
    }
  };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error && accounts.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="space-y-8 pb-10">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Accounts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your bank accounts and balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openCreateModal()
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FiPlus size={18} />
          Create Account
        </button>
      </div>

      {/* ===================================================
          EXISTING ACCOUNTS
      =================================================== */}

      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          message="Create your first bank account to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {accounts.map((account) => {
            const bank =
              resolveBank(
                account,
                banks
              );

            const theme =
              getBankTheme(bank);

            return (
              <div
                key={account._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Account top */}
                <div
                  className={`border-b px-6 py-5 ${theme.light} ${theme.border}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white ${theme.icon}`}
                      >
                        {getInitials(
                          bank?.shortName ||
                            bank?.bankName ||
                            "BANK"
                        )}
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900">
                          {bank?.bankName ||
                            "Bank not assigned"}
                        </h2>

                        <p
                          className={`text-sm font-semibold ${theme.text}`}
                        >
                          {bank?.shortName ||
                            "BANK"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        account.status ===
                        "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                </div>

                {/* Account details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Account Number
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {account.accountNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Account Type
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {account.accountType}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        IFSC
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {account.ifsc ||
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        UPI ID
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {account.upiId ||
                          "Not available"}
                      </p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mt-6 rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Available Balance
                    </p>

                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      ₹
                      {Number(
                        account.balance || 0
                      ).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(
                          account
                        );
                        setMoneyType(
                          "credit"
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <FiArrowDownCircle />
                      Credit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(
                          account
                        );
                        setMoneyType(
                          "debit"
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      <FiArrowUpCircle />
                      Debit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================
          AVAILABLE BANKS
          
          IMPORTANT:
          ONE CONTAINER
          ONE ROW/CARD PER BANK
          
          NO BANK ID
          NO IFSC
          
          Only banks that still have an available
          Savings / Current / Salary account are shown.
      =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            Available Accounts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Each bank is shown only once. You can create
            one Savings, one Current, and one Salary
            account per bank.
          </p>
        </div>

        <div className="p-6">
          {availableBanks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <FiCheckCircle
                className="mx-auto text-emerald-500"
                size={32}
              />

              <h3 className="mt-3 font-semibold text-slate-900">
                All Available Account Types Created
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                You have already created Savings,
                Current, and Salary accounts for all
                available banks.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
              {availableBanks.map(
                ({
                  bank,
                  accountTypes,
                  remainingTypes,
                }) => {
                  const theme =
                    getBankTheme(bank);

                  return (
                    <div
                      key={getBankKey(bank)}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${theme.icon}`}
                        >
                          {getInitials(
                            bank.shortName ||
                              bank.bankName
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            {bank.bankName}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {accountTypes.map(
                              (type) => (
                                <span
                                  key={type}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  {type} created
                                </span>
                              )
                            )}

                            {remainingTypes.map(
                              (type) => (
                                <span
                                  key={type}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${theme.light} ${theme.text}`}
                                >
                                  {type} available
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(
                            bank,
                            remainingTypes[0]
                          )
                        }
                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${theme.button}`}
                      >
                        <FiPlus size={17} />
                        Create Account
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          CREATE ACCOUNT MODAL
      =================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
          <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Bank Account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete the details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={21} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="max-h-[75vh] overflow-y-auto p-6"
            >
              {/* Error */}
              {formError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <FiX
                    className="mt-0.5 shrink-0"
                    size={18}
                  />

                  <span>{formError}</span>
                </div>
              )}

              {/* Bank and Account Type */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bank
                  </label>

                  <select
                    name="bankId"
                    value={form.bankId}
                    onChange={(event) => {
                      const selectedId =
                        event.target.value;

                      const bank =
                        banks.find(
                          (item) =>
                            String(
                              item._id
                            ) ===
                              String(
                                selectedId
                              ) ||
                            String(
                              item.bankId
                            ) ===
                              String(
                                selectedId
                              )
                        );

                      const summary =
                        bankAccountSummary.find(
                          (item) =>
                            getBankKey(
                              item.bank
                            ) ===
                            getBankKey(bank)
                        );

                      const remaining =
                        summary
                          ? ACCOUNT_TYPES.filter(
                              (type) =>
                                !summary.accountTypes.includes(
                                  type
                                )
                            )
                          : ACCOUNT_TYPES;

                      setForm(
                        (previous) => ({
                          ...previous,
                          bankId:
                            selectedId,
                          accountType:
                            remaining[0] ||
                            "Savings",
                        })
                      );
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">
                      Select Bank
                    </option>

                    {availableBanks.map(
                      ({ bank }) => (
                        <option
                          key={getBankKey(
                            bank
                          )}
                          value={bank._id}
                        >
                          {bank.bankName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Account Type
                  </label>

                  <select
                    name="accountType"
                    value={form.accountType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    {ACCOUNT_TYPES.map(
                      (type) => {
                        const selectedBank =
                          banks.find(
                            (bank) =>
                              String(
                                bank._id
                              ) ===
                                String(
                                  form.bankId
                                ) ||
                              String(
                                bank.bankId
                              ) ===
                                String(
                                  form.bankId
                                )
                          );

                        const summary =
                          bankAccountSummary.find(
                            (item) =>
                              getBankKey(
                                item.bank
                              ) ===
                              getBankKey(
                                selectedBank
                              )
                          );

                        const alreadyCreated =
                          summary?.accountTypes.includes(
                            type
                          );

                        return (
                          <option
                            key={type}
                            value={type}
                            disabled={
                              alreadyCreated
                            }
                          >
                            {type}
                            {alreadyCreated
                              ? " (Already Created)"
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
              </div>

              {/* Personal Details */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Personal Details
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name *
                    </label>

                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mobile Number *
                    </label>

                    <input
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={handleChange}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        Select Gender
                      </option>
                      <option value="Male">
                        Male
                      </option>
                      <option value="Female">
                        Female
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Address
                </h3>

                <div className="space-y-5">
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Address"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />

                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />

                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      maxLength={6}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Identity */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Identity Details
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      PAN Number
                    </label>

                    <input
                      name="panNumber"
                      value={form.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Aadhaar Number
                    </label>

                    <input
                      name="aadhaarNumber"
                      value={form.aadhaarNumber}
                      onChange={handleChange}
                      placeholder="12 digit Aadhaar"
                      maxLength={12}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Nominee */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Nominee Details
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <input
                    name="nomineeName"
                    value={form.nomineeName}
                    onChange={handleChange}
                    placeholder="Nominee name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <select
                    name="nomineeRelationship"
                    value={
                      form.nomineeRelationship
                    }
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">
                      Relationship
                    </option>
                    <option value="Parent">
                      Parent
                    </option>
                    <option value="Spouse">
                      Spouse
                    </option>
                    <option value="Child">
                      Child
                    </option>
                    <option value="Sibling">
                      Sibling
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <input
                    name="nomineePhone"
                    value={form.nomineePhone}
                    onChange={handleChange}
                    placeholder="Nominee phone"
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Deposit */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Initial Deposit
                </h3>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="initialDeposit"
                  value={
                    form.initialDeposit
                  }
                  onChange={handleChange}
                  placeholder="Enter initial deposit"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* PIN */}
              <div className="mt-8">
                <h3 className="mb-4 text-base font-bold text-slate-900">
                  Transaction Security
                </h3>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-start gap-3">
                    <FiLock
                      className="mt-0.5 text-indigo-600"
                      size={20}
                    />

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-900">
                        Create a 4-digit Transaction PIN
                      </p>

                      <p className="mt-1 text-xs leading-5 text-indigo-700">
                        This PIN will be required for
                        secure fund transfers.
                      </p>
                    </div>
                  </div>

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    name="transactionPin"
                    value={
                      form.transactionPin
                    }
                    onChange={handleChange}
                    placeholder="••••"
                    className="mt-4 w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          MONEY MODAL
      =================================================== */}

      <MoneyModal
        open={
          Boolean(
            selectedAccount &&
              moneyType
          )
        }
        type={moneyType}
        account={selectedAccount}
        loading={moneyLoading}
        onClose={() => {
          setMoneyType(null);
          setSelectedAccount(null);
        }}
        onSubmit={
          moneyType === "credit"
            ? handleCredit
            : handleDebit
        }
      />

      {/* ===================================================
          MESSAGE MODAL
      =================================================== */}

      <MessageModal
        open={
          messageModal.open
        }
        type={
          messageModal.type
        }
        title={
          messageModal.title
        }
        message={
          messageModal.message
        }
        onClose={() =>
          setMessageModal({
            open: false,
            type: "success",
            title: "",
            message: "",
          })
        }
      />
    </div>
  );
}