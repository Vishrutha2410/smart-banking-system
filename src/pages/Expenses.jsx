import {
  useEffect,
  useState,
} from "react";

import {
  getAccounts,
} from "../services/accountService";

import {
  createExpense,
} from "../services/expenseService";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";

const EXPENSE_CATEGORIES = [
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

const initialForm = {
  accountId: "",
  category: "Food",
  amount: "",
  description: "",
  date: new Date()
    .toISOString()
    .slice(0, 10),
};

const Expenses = () => {
  const [accounts, setAccounts] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [status, setStatus] =
    useState("loading");

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [formSuccess, setFormSuccess] =
    useState("");

  const activeAccounts =
    accounts.filter(
      (account) =>
        String(
          account.status || ""
        ).toLowerCase() ===
        "active"
    );

  const selectedAccount =
    activeAccounts.find(
      (account) =>
        account._id ===
        form.accountId
    );

  /*
   * Load accounts.
   */
  const load = async () => {
    setStatus("loading");

    try {
      const data =
        await getAccounts();

      const safeAccounts =
        Array.isArray(data)
          ? data
          : [];

      setAccounts(
        safeAccounts
      );

      const active =
        safeAccounts.filter(
          (account) =>
            String(
              account.status || ""
            ).toLowerCase() ===
            "active"
        );

      setForm((previous) => ({
        ...previous,

        accountId:
          active.some(
            (account) =>
              account._id ===
              previous.accountId
          )
            ? previous.accountId
            : active[0]?._id ||
              "",
      }));

      setStatus("success");
    } catch (error) {
      console.error(
        "Expense page loading error:",
        error
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * Handle input.
   */
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

    setFormError("");
    setFormSuccess("");
  };

  /*
   * Submit expense.
   */
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!form.accountId) {
      setFormError(
        "Please select an account."
      );
      return;
    }

    if (!form.category) {
      setFormError(
        "Please select an expense category."
      );
      return;
    }

    const numericAmount =
      Number(form.amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setFormError(
        "Amount must be greater than zero."
      );
      return;
    }

    if (
      selectedAccount &&
      numericAmount >
        Number(
          selectedAccount.balance || 0
        )
    ) {
      setFormError(
        "The expense amount is greater than the available balance."
      );
      return;
    }

    setSubmitting(true);

    try {
      await createExpense({
        accountId:
          form.accountId,

        category:
          form.category,

        amount:
          numericAmount,

        description:
          form.description.trim(),

        date:
          form.date,
      });

      setFormSuccess(
        "Expense recorded successfully. Your budget has been updated."
      );

      /*
       * Keep the selected account
       * and category, but clear the
       * amount and description.
       */
      setForm((previous) => ({
        ...previous,

        amount: "",

        description: "",

        date: new Date()
          .toISOString()
          .slice(0, 10),
      }));

      /*
       * Refresh account balances.
       */
      await load();
    } catch (error) {
      console.error(
        "Create expense error:",
        error
      );

      setFormError(
        error.message ||
          "Could not record the expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (
    status === "loading"
  ) {
    return (
      <Loader
        label="Loading expense information..."
      />
    );
  }

  if (
    status === "error"
  ) {
    return (
      <ErrorState
        onRetry={load}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Expenses
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Record your actual spending and
          keep your budgets up to date.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* =================================================
            EXPENSE FORM
        ================================================== */}

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Expense
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Use this page when money is
            actually spent.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {formSuccess}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            {/* Account */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Account
              </label>

              <select
                name="accountId"
                value={
                  form.accountId
                }
                onChange={
                  handleChange
                }
                disabled={
                  activeAccounts.length ===
                  0
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100"
              >
                <option value="">
                  Select account
                </option>

                {activeAccounts.map(
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
                      — ••••{" "}
                      {String(
                        account.accountNumber
                      ).slice(-4)}{" "}
                      (₹
                      {Number(
                        account.balance ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                      )
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Category */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Expense Category
              </label>

              <select
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                {EXPENSE_CATEGORIES.map(
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

              <p className="mt-1 text-xs text-slate-400">
                This category is used by
                your Budget and Analytics.
              </p>
            </div>

            {/* Amount */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₹
                </span>

                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    form.amount
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500"
                  placeholder="0.00"
                />
              </div>

              {selectedAccount && (
                <p className="mt-1 text-xs text-slate-400">
                  Available balance: ₹
                  {Number(
                    selectedAccount.balance ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              )}
            </div>

            {/* Description */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
                <span className="font-normal text-slate-400">
                  {" "}
                  (optional)
                </span>
              </label>

              <input
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                maxLength={200}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="Example: Lunch at restaurant"
              />
            </div>

            {/* Date */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date
              </label>

              <input
                name="date"
                type="date"
                value={
                  form.date
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>

            {/* Info */}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-700">
              Expenses recorded here are
              treated as actual spending and
              will automatically appear in the
              matching monthly Budget.
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={
                submitting ||
                activeAccounts.length ===
                  0
              }
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Recording..."
                : "Record Expense"}
            </button>
          </form>
        </div>

        {/* =================================================
            EXPLANATION
        ================================================== */}

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              How Expenses Work
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  1. Select your account
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The selected account will be
                  debited.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  2. Select the category
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  For example Food, Travel,
                  Shopping or Bills.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  3. Enter the amount
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The amount is deducted from
                  your selected account.
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="font-medium text-emerald-800">
                  4. Budget is updated
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  If a matching budget exists
                  for this month and category,
                  its Spent amount increases.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Fund Transfer vs Expense
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-3 py-3 font-semibold text-slate-600">
                      Action
                    </th>

                    <th className="px-3 py-3 font-semibold text-slate-600">
                      Type
                    </th>

                    <th className="px-3 py-3 font-semibold text-slate-600">
                      Budget
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="px-3 py-3">
                      Send money to friend
                    </td>

                    <td className="px-3 py-3">
                      TRANSFER
                    </td>

                    <td className="px-3 py-3 text-slate-500">
                      Not counted
                    </td>
                  </tr>

                  <tr>
                    <td className="px-3 py-3">
                      Buy food
                    </td>

                    <td className="px-3 py-3">
                      EXPENSE
                    </td>

                    <td className="px-3 py-3 font-medium text-emerald-600">
                      Counted
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;