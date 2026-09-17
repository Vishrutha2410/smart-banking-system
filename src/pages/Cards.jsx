import { useEffect, useState } from "react";
import { FiPlus, FiCreditCard, FiLock, FiUnlock } from "react-icons/fi";
import { getCards, requestCard, setCardStatus } from "../services/cardService";
import { getAccounts } from "../services/accountService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ accountId: "", cardType: "Debit", spendingLimit: 50000 });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const [cardsData, accountsData] = await Promise.all([getCards(), getAccounts()]);
      setCards(cardsData);
      setAccounts(accountsData);
      setForm((f) => ({ ...f, accountId: f.accountId || accountsData[0]?._id || "" }));
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
    if (!form.accountId) {
      setFormError("Please select an account.");
      return;
    }
    setSubmitting(true);
    try {
      const card = await requestCard(form);
      setCards((prev) => [card, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || "Could not request card.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBlock = async (card) => {
    const newStatus = card.status === "blocked" ? "active" : "blocked";
    try {
      const updated = await setCardStatus(card._id, newStatus);
      setCards((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    } catch (err) {
      // no-op
    }
  };

  const activateCard = async (card) => {
    try {
      const updated = await setCardStatus(card._id, "active");
      setCards((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    } catch (err) {
      // no-op
    }
  };

  if (status === "loading") return <Loader label="Loading cards..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cards</h1>
          <p className="text-sm text-slate-500">Manage your debit and credit cards.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={accounts.length === 0}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <FiPlus /> Request Card
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState title="No cards available." icon={FiCreditCard} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-md"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-brand-100">
                <span>{c.cardType} Card</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    c.status === "active"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : c.status === "blocked"
                      ? "bg-red-500/20 text-red-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-6 font-mono text-xl tracking-widest">{c.maskedNumber}</p>
              <div className="mt-6 flex items-center justify-between text-xs text-brand-100">
                <div>
                  <p className="uppercase">Expires</p>
                  <p className="font-medium text-white">
                    {new Date(c.expiryDate).toLocaleDateString("en-US", {
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="uppercase">Available Limit</p>
                  <p className="font-medium text-white">₹{c.availableLimit.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="mt-5">
                {c.status === "requested" ? (
                  <button
                    onClick={() => activateCard(c)}
                    className="w-full rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
                  >
                    Activate Card
                  </button>
                ) : (
                  <button
                    onClick={() => toggleBlock(c)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
                  >
                    {c.status === "blocked" ? (
                      <>
                        <FiUnlock /> Unblock Card
                      </>
                    ) : (
                      <>
                        <FiLock /> Block Card
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Request Card</h2>
            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Linked Account
                </label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.accountType} — •••• {a.accountNumber.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Card Type</label>
                <select
                  value={form.cardType}
                  onChange={(e) => setForm((f) => ({ ...f, cardType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Spending Limit
                </label>
                <input
                  type="number"
                  min="1000"
                  value={form.spendingLimit}
                  onChange={(e) => setForm((f) => ({ ...f, spendingLimit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
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
                  {submitting ? "Requesting..." : "Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
