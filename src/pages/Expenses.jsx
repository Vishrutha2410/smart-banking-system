import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiX,
} from "react-icons/fi";

import { getAccounts } from "../services/accountService";
import { createExpense } from "../services/expenseService";
import { getBudgets } from "../services/budgetService";

const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Groceries",
  "Subscriptions",
  "Other",
];

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getMonthName = (month) => {
  return new Date(2000, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
  });
};

function Expenses() {
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    accountId: "",
    category: "Food",
    amount: "",
    description: "",
    date: getToday(),
  });

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // --------------------------------------------------
  // Load accounts and budgets
  // --------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);

      const [accountsData, budgetsData] = await Promise.all([
        getAccounts(),
        getBudgets(),
      ]);

      const activeAccounts = Array.isArray(accountsData)
        ? accountsData.filter(
            (account) =>
              String(account.status || "").toLowerCase() === "active"
          )
        : [];

      setAccounts(activeAccounts);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);

      // Automatically select first active account
      if (activeAccounts.length > 0) {
        setForm((prev) => ({
          ...prev,
          accountId: prev.accountId || activeAccounts[0]._id,
        }));
      }
    } catch (error) {
      console.error("Failed to load expense data:", error);

      openModal(
        "error",
        "Unable to Load",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load your accounts and budgets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // Selected account
  // --------------------------------------------------
  const selectedAccount = useMemo(() => {
    return accounts.find(
      (account) => account._id === form.accountId
    );
  }, [accounts, form.accountId]);

  // --------------------------------------------------
  // Modal
  // --------------------------------------------------
  const openModal = (type, title, message) => {
    setModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeModal = () => {
    setModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  // --------------------------------------------------
  // Input change
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // Find matching budget
  //
  // Match:
  // category + month + year
  // --------------------------------------------------
  const findMatchingBudget = (category, date) => {
    if (!date) {
      return null;
    }

    const selectedDate = new Date(`${date}T00:00:00`);

    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    return budgets.find((budget) => {
      const sameCategory =
        String(budget.category || "")
          .trim()
          .toLowerCase() ===
        String(category || "")
          .trim()
          .toLowerCase();

      const sameMonth =
        Number(budget.month) === Number(month);

      const sameYear =
        Number(budget.year) === Number(year);

      return sameCategory && sameMonth && sameYear;
    });
  };

  // --------------------------------------------------
  // Record expense
  // --------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    // ----------------------------------------------
    // Basic validation
    // ----------------------------------------------
    if (!form.accountId) {
      openModal(
        "error",
        "Account Required",
        "Please select the account from which this expense will be paid."
      );
      return;
    }

    if (!form.category) {
      openModal(
        "error",
        "Category Required",
        "Please select an expense category."
      );
      return;
    }

    const amount = Number(form.amount);

    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      openModal(
        "error",
        "Invalid Amount",
        "Please enter a valid expense amount greater than ₹0."
      );
      return;
    }

    if (!form.date) {
      openModal(
        "error",
        "Date Required",
        "Please select the date of the expense."
      );
      return;
    }

    // ----------------------------------------------
    // Check account balance
    // ----------------------------------------------
    const balance = Number(selectedAccount?.balance || 0);

    if (amount > balance) {
      openModal(
        "error",
        "Insufficient Balance",
        `Your selected account has only ₹${formatCurrency(
          balance
        )} available. Please enter an amount within your available balance.`
      );
      return;
    }

    // ----------------------------------------------
    // Check matching budget
    // ----------------------------------------------
    const matchingBudget = findMatchingBudget(
      form.category,
      form.date
    );

    if (!matchingBudget) {
      const selectedDate = new Date(
        `${form.date}T00:00:00`
      );

      const selectedMonth =
        selectedDate.getMonth() + 1;

      const selectedYear =
        selectedDate.getFullYear();

      openModal(
        "error",
        "No Budget Found",
        `You don't have a ${form.category} budget for ${getMonthName(
          selectedMonth
        )} ${selectedYear}. Please create a budget for this category and month before recording this expense.`
      );

      return;
    }

    // ----------------------------------------------
    // Create expense
    // ----------------------------------------------
    try {
      setSaving(true);

      await createExpense({
        accountId: form.accountId,
        category: form.category,
        amount,
        description: form.description.trim(),
        date: form.date,
      });

      // --------------------------------------------
      // Update local budget spent value
      // --------------------------------------------
      setBudgets((prevBudgets) =>
        prevBudgets.map((budget) => {
          if (budget._id !== matchingBudget._id) {
            return budget;
          }

          const newSpent =
            Number(budget.spent || 0) + amount;

          const monthlyLimit =
            Number(budget.monthlyLimit || 0);

          const remaining =
            monthlyLimit - newSpent;

          const percentageUsed =
            monthlyLimit > 0
              ? Math.min(
                  Math.round(
                    (newSpent / monthlyLimit) * 100
                  ),
                  999
                )
              : 0;

          return {
            ...budget,
            spent: newSpent,
            remaining,
            percentageUsed,
            overBudget:
              newSpent > monthlyLimit,
          };
        })
      );

      // --------------------------------------------
      // Refresh account balance
      // --------------------------------------------
      const updatedAccounts =
        await getAccounts();

      const activeAccounts = Array.isArray(
        updatedAccounts
      )
        ? updatedAccounts.filter(
            (account) =>
              String(account.status || "").toLowerCase() ===
              "active"
          )
        : [];

      setAccounts(activeAccounts);

      // --------------------------------------------
      // Reset form
      // --------------------------------------------
      setForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        date: getToday(),
      }));

      // --------------------------------------------
      // Success modal
      // --------------------------------------------
      openModal(
        "success",
        "Expense Recorded",
        `Your ${form.category} expense of ₹${formatCurrency(
          amount
        )} was recorded successfully. Your ${form.category} budget has been updated.`
      );
    } catch (error) {
      console.error(
        "Failed to record expense:",
        error
      );

      openModal(
        "error",
        "Expense Not Recorded",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to record the expense. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading your accounts and budgets...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // No active accounts
  // --------------------------------------------------
  if (accounts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FiDollarSign className="h-6 w-6 text-slate-500" />
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Add Expense
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            You need an active account before you can
            record an expense.
          </p>
        </div>

        {modal.open && (
          <MessageModal
            modal={modal}
            onClose={closeModal}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-slate-900">
                Add Expense
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Record money spent from your account.
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Account */}
              <div className="mb-5">
                <label
                  htmlFor="accountId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Account
                </label>

                <select
                  id="accountId"
                  name="accountId"
                  value={form.accountId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {accounts.map((account) => (
                    <option
                      key={account._id}
                      value={account._id}
                    >
                      {account.accountType} — ••••{" "}
                      {String(
                        account.accountNumber || ""
                      ).slice(-4)}{" "}
                      (₹
                      {formatCurrency(
                        account.balance
                      )}
                      )
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  The selected account will be debited.
                </p>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Expense Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  An active budget is required for the
                  selected category and month.
                </p>
              </div>

              {/* Amount */}
              <div className="mb-5">
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Amount
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ₹
                  </span>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Available balance: ₹
                  {formatCurrency(
                    selectedAccount?.balance
                  )}
                </p>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="description"
                  name="description"
                  type="text"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Example: Lunch at restaurant"
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Date */}
              <div className="mb-6">
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>

                <div className="relative">
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    max={getToday()}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />

                  <FiCalendar className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 sm:block" />
                </div>
              </div>

              {/* Record button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Recording..."
                  : "Record Expense"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Centered message modal */}
      {modal.open && (
        <MessageModal
          modal={modal}
          onClose={closeModal}
        />
      )}
    </>
  );
}

// ==================================================
// MESSAGE MODAL
// ==================================================

function MessageModal({ modal, onClose }) {
  const isSuccess =
    modal.type === "success";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Top accent */}
        <div
          className={`h-1.5 w-full ${
            isSuccess
              ? "bg-teal-600"
              : "bg-amber-500"
          }`}
        />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-7 text-center sm:px-8 sm:pb-8">

          {/* Icon */}
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              isSuccess
                ? "bg-teal-50 text-teal-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {isSuccess ? (
              <FiCheckCircle className="h-8 w-8" />
            ) : (
              <FiAlertCircle className="h-8 w-8" />
            )}
          </div>

          {/* Title */}
          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            {modal.title}
          </h2>

          {/* Message */}
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {modal.message}
          </p>

          {/* Button */}
          <button
            type="button"
            onClick={onClose}
            className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSuccess
                ? "bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
                : "bg-slate-800 hover:bg-slate-900 focus:ring-slate-500"
            }`}
          >
            {isSuccess ? "Done" : "Okay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Expenses;