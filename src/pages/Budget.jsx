import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { getBudgets, createBudget, deleteBudget } from "../services/budgetService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: "",
    monthlyLimit: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getBudgets();
      setBudgets(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.category.trim()) {
      setFormError("Category is required.");
      return;
    }
    if (!form.monthlyLimit || Number(form.monthlyLimit) <= 0) {
      setFormError("Monthly limit must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const budget = await createBudget(form);
      setBudgets((prev) => [budget, ...prev]);
      setShowModal(false);
      setForm({ category: "", monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear() });
    } catch (err) {
      setFormError(err.message || "Could not create budget.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      // no-op
    }
  };

  if (status === "loading") return <Loader label="Loading budgets..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget</h1>
          <p className="text-sm text-slate-500">Track your spending against monthly limits.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus /> Create Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState title="No budgets created." message="Set a monthly limit for a spending category to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <div key={b._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{b.category}</h3>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Delete budget"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {MONTHS[b.month - 1]} {b.year}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Budget</span>
                <span className="font-medium text-slate-900">
                  ₹{b.monthlyLimit.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Spent</span>
                <span className="font-medium text-slate-900">₹{b.spent.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Remaining</span>
                <span
                  className={`font-medium ${b.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  ₹{b.remaining.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${b.overBudget ? "bg-red-500" : "bg-brand-600"}`}
                  style={{ width: `${Math.min(b.percentageUsed, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">{b.percentageUsed}% used</p>

              {b.overBudget && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  <FiAlertTriangle /> Over budget
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Create Budget</h2>
            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. Food, Travel, Bills"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.monthlyLimit}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 10000"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Month</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create"}
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
