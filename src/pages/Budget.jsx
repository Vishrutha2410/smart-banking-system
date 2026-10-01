import { useEffect, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";

import {
  getBudgets,
  createBudget,
  deleteBudget,
} from "../services/budgetService";

import { useAuth } from "../context/AuthContext";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STUDENT_CATEGORIES = [
  "Food",
  "Transport",
  "Education",
  "Books & Supplies",
  "College Fees",
  "Hostel / Rent",
  "Healthcare",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Personal Care",
  "Other",
];

const PERSONAL_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Travel",
  "Subscriptions",
  "Other",
];

const now = new Date();

const emptyForm = () => ({
  category: "",
  monthlyLimit: "",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
});

const Budget = () => {
  const { user } = useAuth();

  const customerType =
    user?.customerType || "personal";

  const isStudent =
    customerType === "student";

  const categories = isStudent
    ? STUDENT_CATEGORIES
    : PERSONAL_CATEGORIES;

  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const load = async () => {
    setStatus("loading");

    try {
      const data = await getBudgets();

      setBudgets(
        Array.isArray(data)
          ? data
          : []
      );

      setStatus("success");
    } catch (err) {
      console.error(
        "[Budget] Failed to load budgets:",
        err
      );

      setBudgets([]);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setForm({
      ...emptyForm(),
      category: categories[0] || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.category) {
      setFormError(
        "Please select a budget category."
      );
      return;
    }

    const limit = Number(
      form.monthlyLimit
    );

    if (!limit || limit <= 0) {
      setFormError(
        "Monthly limit must be greater than zero."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        category: form.category,
        monthlyLimit: limit,
        month: Number(form.month),
        year: Number(form.year),
      };

      const budget =
        await createBudget(payload);

      setBudgets((previous) => [
        budget,
        ...previous,
      ]);

      setShowModal(false);
      setForm(emptyForm());
    } catch (err) {
      console.error(
        "[Budget] Failed to create budget:",
        err
      );

      setFormError(
        err?.message ||
          "Could not create budget."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);

      setBudgets((previous) =>
        previous.filter(
          (budget) =>
            budget._id !== id
        )
      );
    } catch (err) {
      console.error(
        "[Budget] Failed to delete budget:",
        err
      );
    }
  };

  if (status === "loading") {
    return (
      <Loader label="Loading budgets..." />
    );
  }

  if (status === "error") {
    return (
      <ErrorState onRetry={load} />
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
            {isStudent
              ? "Student Banking"
              : "Personal Banking"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {isStudent
              ? "Student Budget"
              : "Budget"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isStudent
              ? "Plan your college expenses and manage your monthly student spending."
              : "Track your spending against monthly limits."}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus />
          Create Budget
        </button>
      </div>

      {/* STUDENT INFORMATION */}
      {isStudent && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Create separate limits for food,
          transport, education, hostel expenses,
          entertainment and other student needs.
        </div>
      )}

      {/* BUDGET LIST */}
      {budgets.length === 0 ? (
        <EmptyState
          title={
            isStudent
              ? "No student budgets created yet."
              : "No budgets created."
          }
          message={
            isStudent
              ? "Create your first monthly student budget to start tracking college expenses."
              : "Set a monthly limit for a spending category to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const monthlyLimit =
              Number(
                budget.monthlyLimit
              ) || 0;

            const spent =
              Number(
                budget.spent
              ) || 0;

            const remaining =
              Number(
                budget.remaining
              ) ||
              monthlyLimit - spent;

            const percentageUsed =
              Number(
                budget.percentageUsed
              ) ||
              (monthlyLimit
                ? (spent /
                    monthlyLimit) *
                  100
                : 0);

            const overBudget =
              budget.overBudget ||
              remaining < 0;

            return (
              <div
                key={budget._id}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">
                    {budget.category}
                  </h3>

                  <button
                    onClick={() =>
                      handleDelete(
                        budget._id
                      )
                    }
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Delete budget"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {
                    MONTHS[
                      Number(
                        budget.month
                      ) - 1
                    ]
                  }{" "}
                  {budget.year}
                </p>

                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Budget
                    </span>

                    <span className="font-medium text-slate-900">
                      ₹
                      {monthlyLimit.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Spent
                    </span>

                    <span className="font-medium text-slate-900">
                      ₹
                      {spent.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Remaining
                    </span>

                    <span
                      className={`font-medium ${
                        remaining < 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      ₹
                      {remaining.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      overBudget
                        ? "bg-red-500"
                        : "bg-brand-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.max(
                          percentageUsed,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {Math.round(
                    percentageUsed
                  )}
                  % used
                </p>

                {overBudget && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    <FiAlertTriangle />
                    Over budget
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">
                {isStudent
                  ? "Student Budget"
                  : "Budget"}
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Create Budget
              </h2>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4"
            >
              {/* CATEGORY */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      category:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
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
              </div>

              {/* LIMIT */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monthly Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.monthlyLimit
                  }
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      monthlyLimit:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 5000"
                />
              </div>

              {/* MONTH / YEAR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Month
                  </label>

                  <select
                    value={form.month}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        month: Number(
                          e.target.value
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {MONTHS.map(
                      (month, index) => (
                        <option
                          key={month}
                          value={index + 1}
                        >
                          {month}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Year
                  </label>

                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        year: Number(
                          e.target.value
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
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
                    ? "Creating..."
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;