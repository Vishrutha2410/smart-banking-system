import { useEffect, useState } from "react";
import { getAccounts } from "../services/accountService";
import { getTransfers, createTransfer } from "../services/transferService";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const Transfers = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [form, setForm] = useState({ fromAccountId: "", recipientAccountNumber: "", amount: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const [accountsData, transfersData] = await Promise.all([getAccounts(), getTransfers()]);
      setAccounts(accountsData);
      setTransfers(transfersData);
      setForm((f) => ({ ...f, fromAccountId: f.fromAccountId || accountsData[0]?._id || "" }));
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.fromAccountId || !form.recipientAccountNumber || !form.amount) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (Number(form.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTransfer({
        fromAccountId: form.fromAccountId,
        recipientAccountNumber: form.recipientAccountNumber,
        amount: Number(form.amount),
        description: form.description,
      });
      setFormSuccess("Transfer completed successfully.");
      setForm((f) => ({ ...f, recipientAccountNumber: "", amount: "", description: "" }));
      await load();
    } catch (err) {
      setFormError(err.message || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") return <Loader label="Loading transfer info..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
        <h2 className="text-lg font-semibold text-slate-900">Send Money</h2>
        <p className="mt-1 text-sm text-slate-500">Transfer funds to another account.</p>

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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">From Account</label>
            <select
              name="fromAccountId"
              value={form.fromAccountId}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.accountType} — •••• {a.accountNumber.slice(-4)} (₹
                  {a.balance.toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Recipient Account Number
            </label>
            <input
              name="recipientAccountNumber"
              value={form.recipientAccountNumber}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="What's this for?"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || accounts.length === 0}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Transfer"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Transfer History</h2>
        {transfers.length === 0 ? (
          <EmptyState title="No transfers yet" message="Your sent and received transfers will show here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {transfers.map((t) => {
              const isSender = t.sender?._id === user?._id || t.sender === user?._id;
              return (
                <li key={t._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      {isSender
                        ? `To ${t.recipient?.name || "recipient"}`
                        : `From ${t.sender?.name || "sender"}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.createdAt).toLocaleString()} · Ref: {t.referenceNumber}
                    </p>
                  </div>
                  <span className={`font-semibold ${isSender ? "text-red-500" : "text-emerald-600"}`}>
                    {isSender ? "-" : "+"}₹{t.amount.toLocaleString("en-IN")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Transfers;
