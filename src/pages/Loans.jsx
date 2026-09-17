import { useEffect, useState } from "react";
import { FiPlus, FiFileText } from "react-icons/fi";
import { getLoans, applyForLoan } from "../services/loanService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const LOAN_TYPES = ["Personal Loan", "Education Loan", "Home Loan", "Vehicle Loan"];
const INTEREST_RATES = { "Personal Loan": 12, "Education Loan": 8, "Home Loan": 7, "Vehicle Loan": 9 };

const calculateEMI = (principal, annualRatePercent, tenureMonths) => {
  const monthlyRate = annualRatePercent / 12 / 100;
  if (!principal || !tenureMonths) return 0;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
};

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  Active: "bg-brand-50 text-brand-700",
  Completed: "bg-slate-100 text-slate-500",
};

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ loanType: "Personal Loan", amount: "", tenure: "12", purpose: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getLoans();
      setLoans(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const previewEMI = calculateEMI(
    Number(form.amount) || 0,
    INTEREST_RATES[form.loanType],
    Number(form.tenure) || 1
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const numericAmount = Number(form.amount);
    const numericTenure = Number(form.tenure);

    if (!numericAmount || numericAmount < 1000) {
      setFormError("Loan amount must be at least ₹1,000.");
      return;
    }
    if (!numericTenure || numericTenure < 1) {
      setFormError("Tenure must be at least 1 month.");
      return;
    }

    setSubmitting(true);
    try {
      const loan = await applyForLoan(form);
      setLoans((prev) => [loan, ...prev]);
      setShowModal(false);
      setForm({ loanType: "Personal Loan", amount: "", tenure: "12", purpose: "" });
    } catch (err) {
      setFormError(err.message || "Could not submit loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") return <Loader label="Loading loans..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loans</h1>
          <p className="text-sm text-slate-500">Apply for and track your loan applications.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus /> Apply for Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <EmptyState title="No loan applications yet" icon={FiFileText} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Tenure</th>
                <th className="px-4 py-3 text-right">Monthly Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 text-slate-800">{l.loanType}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    ₹{l.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.interestRate}%</td>
                  <td className="px-4 py-3 text-slate-500">{l.tenure} mo</td>
                  <td className="px-4 py-3 text-right text-slate-800">
                    ₹{l.monthlyPayment.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(l.appliedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Apply for Loan</h2>
            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Loan Type</label>
                <select
                  value={form.loanType}
                  onChange={(e) => setForm((f) => ({ ...f, loanType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t} ({INTEREST_RATES[t]}% p.a.)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <input
                  type="number"
                  min="1000"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. 200000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tenure (months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.tenure}
                  onChange={(e) => setForm((f) => ({ ...f, tenure: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Purpose (optional)
                </label>
                <input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {Number(form.amount) > 0 && (
                <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Estimated EMI: <span className="font-semibold">₹{previewEMI.toLocaleString("en-IN")}</span>/month
                </div>
              )}

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
                  {submitting ? "Applying..." : "Submit Application"}
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
