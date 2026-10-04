import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiShoppingBag,
  FiTruck,
  FiTool,
  FiX,
} from "react-icons/fi";

import { getAccounts } from "../services/accountService";
import { createExpense } from "../services/expenseService";
import { getBudgets } from "../services/budgetService";

/* ======================================================
   BUSINESS EXPENSE CATEGORIES
====================================================== */

const BUSINESS_CATEGORIES = [
  "Office Expenses",
  "Travel",
  "Employee Expenses",
  "Utilities",
  "Equipment",
  "Supplies",
  "Marketing",
  "Subscriptions",
  "Professional Services",
  "Other",
];

/* ======================================================
   HELPERS
====================================================== */

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

const getMonthName = (month) => {
  return new Date(
    2000,
    month - 1,
    1
  ).toLocaleString("en-IN", {
    month: "long",
  });
};

/* ======================================================
   CATEGORY ICON
====================================================== */

const CategoryIcon = ({
  category,
}) => {
  const normalized = String(
    category || ""
  ).toLowerCase();

  if (
    normalized.includes("travel")
  ) {
    return (
      <FiTruck className="h-5 w-5" />
    );
  }

  if (
    normalized.includes("office") ||
    normalized.includes("supplies")
  ) {
    return (
      <FiShoppingBag className="h-5 w-5" />
    );
  }

  if (
    normalized.includes("equipment") ||
    normalized.includes("professional")
  ) {
    return (
      <FiTool className="h-5 w-5" />
    );
  }

  return (
    <FiDollarSign className="h-5 w-5" />
  );
};

/* ======================================================
   MAIN COMPONENT
====================================================== */

const BusinessExpenses = () => {
  const [accounts, setAccounts] =
    useState([]);

  const [budgets, setBudgets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      accountId: "",
      category:
        BUSINESS_CATEGORIES[0],
      amount: "",
      description: "",
      date: getToday(),
    });

  const [modal, setModal] =
    useState({
      open: false,
      type: "success",
      title: "",
      message: "",
    });

  /* ====================================================
     MODAL
  ==================================================== */

  const openModal = (
    type,
    title,
    message
  ) => {
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

  /* ====================================================
     LOAD ACCOUNTS + BUDGETS
  ==================================================== */

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        accountsData,
        budgetsData,
      ] = await Promise.all([
        getAccounts(),
        getBudgets(),
      ]);

      const activeAccounts =
        Array.isArray(accountsData)
          ? accountsData.filter(
              (account) =>
                String(
                  account.status || ""
                ).toLowerCase() ===
                "active"
            )
          : [];

      setAccounts(activeAccounts);

      setBudgets(
        Array.isArray(budgetsData)
          ? budgetsData
          : []
      );

      if (
        activeAccounts.length > 0
      ) {
        setForm((previous) => ({
          ...previous,
          accountId:
            previous.accountId ||
            activeAccounts[0]._id,
        }));
      }
    } catch (error) {
      console.error(
        "Failed to load business expense data:",
        error
      );

      openModal(
        "error",
        "Unable to Load",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to load your business accounts and budgets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ====================================================
     SELECTED ACCOUNT
  ==================================================== */

  const selectedAccount =
    useMemo(() => {
      return accounts.find(
        (account) =>
          account._id ===
          form.accountId
      );
    }, [
      accounts,
      form.accountId,
    ]);

  /* ====================================================
     FIND MATCHING BUSINESS BUDGET
  ==================================================== */

  const findMatchingBudget = (
    category,
    date
  ) => {
    if (!date) {
      return null;
    }

    const selectedDate =
      new Date(
        `${date}T00:00:00`
      );

    const month =
      selectedDate.getMonth() + 1;

    const year =
      selectedDate.getFullYear();

    return budgets.find(
      (budget) => {
        const sameCategory =
          String(
            budget.category || ""
          )
            .trim()
            .toLowerCase() ===
          String(
            category || ""
          )
            .trim()
            .toLowerCase();

        const sameMonth =
          Number(budget.month) ===
          Number(month);

        const sameYear =
          Number(budget.year) ===
          Number(year);

        return (
          sameCategory &&
          sameMonth &&
          sameYear
        );
      }
    );
  };

  /* ====================================================
     HANDLE INPUT
  ==================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ====================================================
     RECORD BUSINESS EXPENSE
  ==================================================== */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    /* ----------------------------------------------
       ACCOUNT
    ---------------------------------------------- */

    if (!form.accountId) {
      openModal(
        "error",
        "Account Required",
        "Please select the business account from which this expense will be paid."
      );

      return;
    }

    /* ----------------------------------------------
       CATEGORY
    ---------------------------------------------- */

    if (!form.category) {
      openModal(
        "error",
        "Category Required",
        "Please select a business expense category."
      );

      return;
    }

    /* ----------------------------------------------
       AMOUNT
    ---------------------------------------------- */

    const amount = Number(
      form.amount
    );

    if (
      !form.amount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      openModal(
        "error",
        "Invalid Amount",
        "Please enter a valid business expense amount greater than ₹0."
      );

      return;
    }

    /* ----------------------------------------------
       DATE
    ---------------------------------------------- */

    if (!form.date) {
      openModal(
        "error",
        "Date Required",
        "Please select the date of the business expense."
      );

      return;
    }

    /* ----------------------------------------------
       BALANCE
    ---------------------------------------------- */

    const balance = Number(
      selectedAccount?.balance || 0
    );

    if (amount > balance) {
      openModal(
        "error",
        "Insufficient Balance",
        `Your selected account has only ₹${formatCurrency(
          balance
        )} available. Please enter an amount within the available balance.`
      );

      return;
    }

    /* ----------------------------------------------
       BUDGET
    ---------------------------------------------- */

    const matchingBudget =
      findMatchingBudget(
        form.category,
        form.date
      );

    if (!matchingBudget) {
      const selectedDate =
        new Date(
          `${form.date}T00:00:00`
        );

      const selectedMonth =
        selectedDate.getMonth() + 1;

      const selectedYear =
        selectedDate.getFullYear();

      openModal(
        "error",
        "No Business Budget Found",
        `You don't have a ${form.category} budget for ${getMonthName(
          selectedMonth
        )} ${selectedYear}. Please create a business budget for this category and month before recording the expense.`
      );

      return;
    }

    /* ----------------------------------------------
       CREATE EXPENSE
    ---------------------------------------------- */

    try {
      setSaving(true);

      await createExpense({
        accountId:
          form.accountId,

        category:
          form.category,

        amount,

        description:
          form.description.trim(),

        date:
          form.date,
      });

      /* --------------------------------------------
         UPDATE LOCAL BUDGET
      -------------------------------------------- */

      setBudgets(
        (previousBudgets) =>
          previousBudgets.map(
            (budget) => {
              if (
                budget._id !==
                matchingBudget._id
              ) {
                return budget;
              }

              const newSpent =
                Number(
                  budget.spent || 0
                ) + amount;

              const monthlyLimit =
                Number(
                  budget.monthlyLimit ||
                    0
                );

              const remaining =
                monthlyLimit -
                newSpent;

              const percentageUsed =
                monthlyLimit > 0
                  ? Math.min(
                      Math.round(
                        (newSpent /
                          monthlyLimit) *
                          100
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
                  newSpent >
                  monthlyLimit,
              };
            }
          )
      );

      /* --------------------------------------------
         REFRESH ACCOUNTS
      -------------------------------------------- */

      const updatedAccounts =
        await getAccounts();

      const activeAccounts =
        Array.isArray(
          updatedAccounts
        )
          ? updatedAccounts.filter(
              (account) =>
                String(
                  account.status || ""
                ).toLowerCase() ===
                "active"
            )
          : [];

      setAccounts(
        activeAccounts
      );

      /* --------------------------------------------
         RESET FORM
      -------------------------------------------- */

      setForm(
        (previous) => ({
          ...previous,

          amount: "",

          description: "",

          date: getToday(),
        })
      );

      /* --------------------------------------------
         SUCCESS
      -------------------------------------------- */

      openModal(
        "success",
        "Business Expense Recorded",
        `Your ${form.category} expense of ₹${formatCurrency(
          amount
        )} was recorded successfully and the business budget has been updated.`
      );
    } catch (error) {
      console.error(
        "Failed to record business expense:",
        error
      );

      openModal(
        "error",
        "Expense Not Recorded",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to record the business expense. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================
     LOADING
  ==================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading your business accounts and budgets...
          </p>
        </div>
      </div>
    );
  }

  /* ====================================================
     NO ACTIVE ACCOUNTS
  ==================================================== */

  if (accounts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <FiBriefcase className="h-6 w-6 text-emerald-600" />
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Business Expenses
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            You need an active business
            account before you can record
            a business expense.
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

  /* ====================================================
     MAIN UI
  ==================================================== */

  return (
    <>
      <div className="min-h-full">
        <div className="mx-auto max-w-3xl">

          {/* =================================================
              BUSINESS INTRO
          ================================================= */}

          <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <FiBriefcase className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Business Expense Tracker
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Record and monitor your
                  business operating expenses,
                  employee costs, travel,
                  equipment, supplies and
                  other business spending.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              FORM CARD
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* HEADER */}

            <div className="mb-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FiDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Business Expenses
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Record money spent from
                    your business account.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
            >

              {/* =================================================
                  ACCOUNT
              ================================================= */}

              <div className="mb-5">
                <label
                  htmlFor="business-expense-account"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Business Account
                </label>

                <select
                  id="business-expense-account"
                  name="accountId"
                  value={
                    form.accountId
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
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
                        {account.accountType}
                        {" — ••••"}
                        {String(
                          account.accountNumber ||
                            ""
                        ).slice(
                          -4
                        )}
                        {" "}
                        (₹
                        {formatCurrency(
                          account.balance
                        )}
                        )
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  The selected business
                  account will be debited.
                </p>
              </div>

              {/* =================================================
                  CATEGORY
              ================================================= */}

              <div className="mb-5">
                <label
                  htmlFor="business-expense-category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Business Expense Category
                </label>

                <select
                  id="business-expense-category"
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {BUSINESS_CATEGORIES.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUSINESS_CATEGORIES.slice(
                    0,
                    6
                  ).map(
                    (category) => (
                      <button
                        key={
                          category
                        }
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              category,
                            })
                          )
                        }
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                          form.category ===
                          category
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <CategoryIcon
                          category={
                            category
                          }
                        />

                        <span className="truncate">
                          {category}
                        </span>
                      </button>
                    )
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  A matching business budget
                  is required for the selected
                  category and month.
                </p>
              </div>

              {/* =================================================
                  AMOUNT
              ================================================= */}

              <div className="mb-5">
                <label
                  htmlFor="business-expense-amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Amount
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ₹
                  </span>

                  <input
                    id="business-expense-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.amount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Available balance
                  </p>

                  <p className="text-xs font-semibold text-slate-700">
                    ₹
                    {formatCurrency(
                      selectedAccount?.balance
                    )}
                  </p>
                </div>
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="mb-5">
                <label
                  htmlFor="business-expense-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="business-expense-description"
                  name="description"
                  type="text"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Office supplies purchased"
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* =================================================
                  DATE
              ================================================= */}

              <div className="mb-6">
                <label
                  htmlFor="business-expense-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>

                <div className="relative">
                  <input
                    id="business-expense-date"
                    name="date"
                    type="date"
                    value={
                      form.date
                    }
                    onChange={
                      handleChange
                    }
                    max={getToday()}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <FiCalendar className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 sm:block" />
                </div>
              </div>

              {/* =================================================
                  BUDGET PREVIEW
              ================================================= */}

              {form.category && (
                <BudgetPreview
                  budget={findMatchingBudget(
                    form.category,
                    form.date
                  )}
                />
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={
                  saving
                }
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Recording..."
                  : "Record Business Expense"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {modal.open && (
        <MessageModal
          modal={modal}
          onClose={
            closeModal
          }
        />
      )}
    </>
  );
};

/* ========================================================
   BUDGET PREVIEW
======================================================== */

const BudgetPreview = ({
  budget,
}) => {
  if (!budget) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-800">
              No matching business budget
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Create a business budget for
              this category and month before
              recording the expense.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const limit = Number(
    budget.monthlyLimit || 0
  );

  const spent = Number(
    budget.spent || 0
  );

  const remaining =
    limit - spent;

  const percentage =
    limit > 0
      ? Math.min(
          Math.round(
            (spent / limit) * 100
          ),
          999
        )
      : 0;

  const overBudget =
    spent > limit;

  return (
    <div
      className={`mb-6 rounded-xl border p-4 ${
        overBudget
          ? "border-red-200 bg-red-50"
          : "border-emerald-100 bg-emerald-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-semibold ${
              overBudget
                ? "text-red-800"
                : "text-emerald-800"
            }`}
          >
            Current Business Budget
          </p>

          <p
            className={`mt-1 text-xs ${
              overBudget
                ? "text-red-700"
                : "text-emerald-700"
            }`}
          >
            ₹
            {formatCurrency(
              spent
            )}{" "}
            spent of ₹
            {formatCurrency(
              limit
            )}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            overBudget
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full ${
            overBudget
              ? "bg-red-500"
              : "bg-emerald-500"
          }`}
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />
      </div>

      <p
        className={`mt-2 text-xs ${
          overBudget
            ? "text-red-700"
            : "text-emerald-700"
        }`}
      >
        {overBudget
          ? `Over budget by ₹${formatCurrency(
              Math.abs(
                remaining
              )
            )}`
          : `₹${formatCurrency(
              remaining
            )} remaining`}
      </p>
    </div>
  );
};

/* ========================================================
   MESSAGE MODAL
======================================================== */

const MessageModal = ({
  modal,
  onClose,
}) => {
  const isSuccess =
    modal.type ===
    "success";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        <div
          className={`h-1.5 w-full ${
            isSuccess
              ? "bg-emerald-600"
              : "bg-amber-500"
          }`}
        />

        <button
          type="button"
          onClick={
            onClose
          }
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-7 text-center sm:px-8 sm:pb-8">

          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              isSuccess
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {isSuccess ? (
              <FiCheckCircle className="h-8 w-8" />
            ) : (
              <FiAlertCircle className="h-8 w-8" />
            )}
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            {modal.title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {modal.message}
          </p>

          <button
            type="button"
            onClick={
              onClose
            }
            className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
              isSuccess
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-700 hover:bg-slate-800"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessExpenses;

