import { useEffect, useState } from "react";
import {
  FiPlus,
  FiCreditCard,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import {
  getCards,
  requestCard,
  setCardStatus,
} from "../services/cardService";

import { getAccounts } from "../services/accountService";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [status, setStatus] = useState("loading");

  // Request card modal
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    accountId: "",
    cardType: "Debit",
    spendingLimit: 50000,
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // PIN modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);

  // =========================================================
  // LOAD CARDS + ACCOUNTS
  // =========================================================

  const load = async () => {
    setStatus("loading");

    try {
      const [cardsData, accountsData] = await Promise.all([
        getCards(),
        getAccounts(),
      ]);

      setCards(Array.isArray(cardsData) ? cardsData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);

      setForm((previous) => ({
        ...previous,
        accountId:
          previous.accountId ||
          accountsData?.[0]?._id ||
          "",
      }));

      setStatus("success");
    } catch (err) {
      console.error("Cards loading error:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================================================
  // REQUEST CARD
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!form.accountId) {
      setFormError("Please select an account.");
      return;
    }

    setSubmitting(true);

    try {
      const card = await requestCard({
        ...form,
        spendingLimit: Number(form.spendingLimit),
      });

      setCards((previous) => [card, ...previous]);

      setShowModal(false);

      setForm((previous) => ({
        ...previous,
        cardType: "Debit",
        spendingLimit: 50000,
      }));
    } catch (err) {
      console.error("Card request failed:", err);

      setFormError(
        err.message || "Could not request card."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // OPEN ACTIVATION PIN MODAL
  // =========================================================

  const openActivateModal = (card) => {
    setSelectedCard(card);

    setPin("");
    setConfirmPin("");

    setPinError("");

    setShowPin(false);
    setShowConfirmPin(false);

    setShowPinModal(true);
  };

  // =========================================================
  // ACTIVATE CARD + SET PIN
  // =========================================================

  const activateCard = async (e) => {
    e.preventDefault();

    setPinError("");

    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      setPinError(
        "PIN must contain exactly 4 digits."
      );
      return;
    }

    // Validate confirmation
    if (pin !== confirmPin) {
      setPinError(
        "PIN and confirm PIN do not match."
      );
      return;
    }

    if (!selectedCard) {
      setPinError("No card selected.");
      return;
    }

    setPinSubmitting(true);

    try {
      const updated = await setCardStatus(
        selectedCard._id,
        "active",
        pin,
        confirmPin
      );

      setCards((previous) =>
        previous.map((card) =>
          card._id === updated._id
            ? updated
            : card
        )
      );

      // Close modal
      setShowPinModal(false);

      setSelectedCard(null);

      setPin("");
      setConfirmPin("");
      setPinError("");
    } catch (err) {
      console.error(
        "Card activation failed:",
        err
      );

      setPinError(
        err.message ||
          "Could not activate card."
      );
    } finally {
      setPinSubmitting(false);
    }
  };

  // =========================================================
  // BLOCK / UNBLOCK CARD
  // =========================================================

  const toggleBlock = async (card) => {
    try {
      const newStatus =
        card.status === "blocked"
          ? "active"
          : "blocked";

      const updated = await setCardStatus(
        card._id,
        newStatus
      );

      setCards((previous) =>
        previous.map((currentCard) =>
          currentCard._id === updated._id
            ? updated
            : currentCard
        )
      );
    } catch (err) {
      console.error(
        "Card status update failed:",
        err
      );
    }
  };

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  if (status === "loading") {
    return <Loader label="Loading cards..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cards
          </h1>

          <p className="text-sm text-slate-500">
            Manage your debit and credit cards.
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
          }}
          disabled={accounts.length === 0}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <FiPlus />
          Request Card
        </button>
      </div>

      {/* =====================================================
          CARDS
      ====================================================== */}

      {cards.length === 0 ? (
        <EmptyState
          title="No cards available."
          icon={FiCreditCard}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card._id}
              className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-md"
            >
              {/* Card Header */}

              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-brand-100">
                <span>
                  {card.cardType} Card
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    card.status === "active"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : card.status === "blocked"
                      ? "bg-red-500/20 text-red-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {card.status}
                </span>
              </div>

              {/* Card Number */}

              <p className="mt-6 font-mono text-xl tracking-widest">
                {card.maskedNumber}
              </p>

              {/* Expiry + Limit */}

              <div className="mt-6 flex items-center justify-between text-xs text-brand-100">
                <div>
                  <p className="uppercase">
                    Expires
                  </p>

                  <p className="font-medium text-white">
                    {new Date(
                      card.expiryDate
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        year: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="uppercase">
                    Available Limit
                  </p>

                  <p className="font-medium text-white">
                    ₹
                    {Number(
                      card.availableLimit || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Card Actions */}

              <div className="mt-5">
                {/* REQUESTED */}

                {card.status === "requested" ? (
                  <button
                    onClick={() =>
                      openActivateModal(card)
                    }
                    className="w-full rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
                  >
                    Activate Card
                  </button>
                ) : (
                  /* ACTIVE / BLOCKED */

                  <button
                    onClick={() =>
                      toggleBlock(card)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
                  >
                    {card.status ===
                    "blocked" ? (
                      <>
                        <FiUnlock />
                        Unblock Card
                      </>
                    ) : (
                      <>
                        <FiLock />
                        Block Card
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          REQUEST CARD MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Request Card
            </h2>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4"
            >
              {/* Linked Account */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Linked Account
                </label>

                <select
                  value={form.accountId}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      accountId:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {accounts.map((account) => (
                    <option
                      key={account._id}
                      value={account._id}
                    >
                      {account.accountType} —
                      ••••{" "}
                      {account.accountNumber.slice(
                        -4
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Type */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Card Type
                </label>

                <select
                  value={form.cardType}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      cardType:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Debit">
                    Debit
                  </option>

                  <option value="Credit">
                    Credit
                  </option>
                </select>
              </div>

              {/* Spending Limit */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Spending Limit
                </label>

                <input
                  type="number"
                  min="1000"
                  value={form.spendingLimit}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      spendingLimit:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Buttons */}

              <div className="flex gap-3">
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
                    ? "Requesting..."
                    : "Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ACTIVATE CARD / SET PIN MODAL
      ====================================================== */}

      {showPinModal && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <FiLock />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Activate Card
                </h2>

                <p className="text-sm text-slate-500">
                  Set your transaction PIN
                </p>
              </div>
            </div>

            {/* Card Information */}

            <div className="mt-5 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                Card
              </p>

              <p className="mt-1 font-mono text-sm font-medium text-slate-800">
                {selectedCard.maskedNumber}
              </p>
            </div>

            {/* Error */}

            {pinError && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {pinError}
              </div>
            )}

            <form
              onSubmit={activateCard}
              className="mt-5 space-y-4"
            >
              {/* PIN */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Create 4-Digit Transaction PIN
                </label>

                <div className="relative">
                  <input
                    type={
                      showPin
                        ? "text"
                        : "password"
                    }
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) =>
                      setPin(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 pr-10 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPin(
                        (previous) =>
                          !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm PIN */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Confirm Transaction PIN
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPin
                        ? "text"
                        : "password"
                    }
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 pr-10 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPin(
                        (previous) =>
                          !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPin ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>
                </div>
              </div>

              {/* Information */}

              <div className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                This 4-digit PIN will be
                required when you credit,
                debit, or transfer money from
                this account.
                <br />
                <br />
                Never share your PIN with
                anyone.
              </div>

              {/* Buttons */}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setSelectedCard(null);
                    setPin("");
                    setConfirmPin("");
                    setPinError("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={pinSubmitting}
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pinSubmitting
                    ? "Activating..."
                    : "Activate Card"}
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