import { useEffect, useState } from "react";
import { FiPlus, FiArrowDownCircle, FiArrowUpCircle } from "react-icons/fi";
import {
  getAccounts,
  createAccount,
  setAccountStatus,
  creditAccount,
  debitAccount,
} from "../services/accountService";
import { useNotifications } from "../context/NotificationContext";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const ACCOUNT_TYPES = ["Savings", "Current", "Salary"];

const MoneyModal = ({ mode, account, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCredit = mode === "credit";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const action = isCredit ? creditAccount : debitAccount;
      const result = await action(account._id, numericAmount, description);
      onSuccess(result.account);
    } catch (err) {
      setError(err.message || `Could not ${mode} the account.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">
          {isCredit ? "Credit Money" : "Debit Money"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Account •••• {account.accountNumber.slice(-4)} — Current balance: ₹
          {account.balance.toLocaleString("en-IN")}
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={isCredit ? "e.g. Salary deposit" : "e.g. Grocery shopping"}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
                isCredit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting ? (isCredit ? "Crediting..." : "Debiting...") : isCredit ? "Credit Money" : "Debit Money"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [moneyModal, setMoneyModal] = useState(null); // { mode: 'credit'|'debit', account }
  const [selectedType, setSelectedType] = useState("Savings");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const { refresh: refreshNotifications } = useNotifications();

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getAccounts();
      setAccounts(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const account = await createAccount(selectedType);
      setAccounts((prev) => [account, ...prev]);
      setShowCreateModal(false);
      refreshNotifications();
    } catch (err) {
      setFormError(err.message || "Could not create account.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (account) => {
    const newStatus = account.status === "active" ? "inactive" : "active";
    try {
      const updated = await setAccountStatus(account._id, newStatus);
      setAccounts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      refreshNotifications();
    } catch (err) {
      // no-op
    }
  };

  const handleMoneySuccess = (updatedAccount) => {
    setAccounts((prev) => prev.map((a) => (a._id === updatedAccount._id ? updatedAccount : a)));
    setMoneyModal(null);
    refreshNotifications();
  };

  if (status === "loading") return <Loader label="Loading accounts..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-sm text-slate-500">Manage your bank accounts.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiPlus /> New Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState title="No accounts found" message="Create your first account to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {a.accountType}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    a.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-400">Account Number</p>
              <p className="font-mono text-lg text-slate-900">{a.accountNumber}</p>
              <p className="mt-3 text-sm text-slate-400">Balance</p>
              <p className="text-2xl font-bold text-slate-900">
                ₹{a.balance.toLocaleString("en-IN")}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Opened {new Date(a.createdAt).toLocaleDateString()}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMoneyModal({ mode: "credit", account: a })}
                  disabled={a.status !== "active"}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiArrowDownCircle /> Credit
                </button>
                <button
                  onClick={() => setMoneyModal({ mode: "debit", account: a })}
                  disabled={a.status !== "active"}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiArrowUpCircle /> Debit
                </button>
              </div>

              <button
                onClick={() => toggleStatus(a)}
                className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {a.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Create Account</h2>
            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Account Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moneyModal && (
        <MoneyModal
          mode={moneyModal.mode}
          account={moneyModal.account}
          onClose={() => setMoneyModal(null)}
          onSuccess={handleMoneySuccess}
        />
      )}
    </div>
  );
};

export default Accounts;
