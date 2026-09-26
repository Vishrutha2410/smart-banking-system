import { useEffect, useState } from "react";

import { getAccounts } from "../services/accountService";

import {
  getTransfers,
  createTransfer,
} from "../services/transferService";

import { useAuth } from "../context/AuthContext";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const TRANSFER_TYPES = {
  UPI: "UPI",
  IMPS: "IMPS",
  NEFT: "NEFT",
  RTGS: "RTGS",
  SELF: "SELF",
};

const initialForm = {
  transferType: "UPI",

  fromAccountId: "",

  // UPI
  recipientUpiId: "",

  // IMPS / NEFT / RTGS
  recipientAccountNumber: "",
  recipientName: "",
  recipientIfsc: "",

  // SELF
  toAccountId: "",

  amount: "",
  transactionPin: "",
  description: "",
};

const Transfers = () => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [status, setStatus] = useState("loading");

  const [form, setForm] = useState(initialForm);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // ONLY ACTIVE ACCOUNTS CAN BE USED FOR TRANSFERS
  // =========================================================

  const activeAccounts = accounts.filter(
    (account) =>
      String(account.status || "").toLowerCase() ===
      "active"
  );

  // =========================================================
  // LOAD ACCOUNTS + TRANSFERS
  // =========================================================

  const load = async () => {
    setStatus("loading");

    try {
      const [
        accountsData,
        transfersData,
      ] = await Promise.all([
        getAccounts(),
        getTransfers(),
      ]);

      const safeAccounts = Array.isArray(
        accountsData
      )
        ? accountsData
        : [];

      const safeTransfers = Array.isArray(
        transfersData
      )
        ? transfersData
        : [];

      setAccounts(safeAccounts);
      setTransfers(safeTransfers);

      const active =
        safeAccounts.filter(
          (account) =>
            String(
              account.status || ""
            ).toLowerCase() === "active"
        );

      setForm((previous) => ({
        ...previous,

        fromAccountId:
          active.some(
            (account) =>
              account._id ===
              previous.fromAccountId
          )
            ? previous.fromAccountId
            : active[0]?._id || "",
      }));

      setStatus("success");
    } catch (error) {
      console.error(
        "Transfer page loading error:",
        error
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
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

  // =========================================================
  // TRANSFER TYPE CHANGE
  // =========================================================

  const handleTransferTypeChange = (
    event
  ) => {
    const transferType =
      event.target.value;

    setForm({
      ...initialForm,

      transferType,

      fromAccountId:
        activeAccounts[0]?._id || "",
    });

    setFormError("");
    setFormSuccess("");
  };

  // =========================================================
  // VALIDATE FORM
  // =========================================================

  const validateForm = () => {
    if (!form.transferType) {
      return "Please select a transfer type.";
    }

    if (!form.fromAccountId) {
      return "Please select an active source account.";
    }

    const sourceAccount =
      activeAccounts.find(
        (account) =>
          account._id ===
          form.fromAccountId
      );

    if (!sourceAccount) {
      return "The selected source account is not active.";
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      return "Amount must be greater than zero.";
    }

    // =====================================================
    // UPI
    // =====================================================

    if (
      form.transferType ===
      TRANSFER_TYPES.UPI
    ) {
      if (!form.recipientUpiId.trim()) {
        return "Please enter the recipient UPI ID.";
      }
    }

    // =====================================================
    // IMPS / NEFT / RTGS
    // =====================================================

    if (
      form.transferType ===
        TRANSFER_TYPES.IMPS ||
      form.transferType ===
        TRANSFER_TYPES.NEFT ||
      form.transferType ===
        TRANSFER_TYPES.RTGS
    ) {
      if (!form.recipientName.trim()) {
        return "Please enter the recipient name.";
      }

      if (
        !form.recipientAccountNumber.trim()
      ) {
        return "Please enter the recipient account number.";
      }

      if (!form.recipientIfsc.trim()) {
        return "Please enter the recipient IFSC code.";
      }

      if (
        form.recipientIfsc.trim().length !==
        11
      ) {
        return "IFSC code must contain 11 characters.";
      }
    }

    // =====================================================
    // SELF
    // =====================================================

    if (
      form.transferType ===
      TRANSFER_TYPES.SELF
    ) {
      if (!form.toAccountId) {
        return "Please select your destination account.";
      }

      if (
        form.fromAccountId ===
        form.toAccountId
      ) {
        return "Source and destination accounts must be different.";
      }
    }

    // =====================================================
    // TRANSACTION PIN
    // =====================================================

    if (!/^\d{4}$/.test(form.transactionPin)) {
      return "Please enter your 4-digit transaction PIN.";
    }

    return "";
  };

  // =========================================================
  // SUBMIT TRANSFER
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const transferData = {
        transferType:
          form.transferType,

        fromAccountId:
          form.fromAccountId,

        amount: Number(form.amount),

        transactionPin:
          form.transactionPin,

        description:
          form.description.trim(),
      };

      // =====================================================
      // UPI
      // =====================================================

      if (
        form.transferType ===
        TRANSFER_TYPES.UPI
      ) {
        transferData.recipientUpiId =
          form.recipientUpiId.trim();
      }

      // =====================================================
      // IMPS / NEFT / RTGS
      // =====================================================

      if (
        form.transferType ===
          TRANSFER_TYPES.IMPS ||
        form.transferType ===
          TRANSFER_TYPES.NEFT ||
        form.transferType ===
          TRANSFER_TYPES.RTGS
      ) {
        transferData.recipientName =
          form.recipientName.trim();

        transferData.recipientAccountNumber =
          form.recipientAccountNumber.trim();

        transferData.recipientIfsc =
          form.recipientIfsc
            .trim()
            .toUpperCase();
      }

      // =====================================================
      // SELF
      // =====================================================

      if (
        form.transferType ===
        TRANSFER_TYPES.SELF
      ) {
        transferData.toAccountId =
          form.toAccountId;
      }

      await createTransfer(
        transferData
      );

      setFormSuccess(
        `${form.transferType} transfer completed successfully.`
      );

      // Keep selected transfer type,
      // select first active account again
      setForm({
        ...initialForm,

        transferType:
          form.transferType,

        fromAccountId:
          activeAccounts[0]?._id || "",
      });

      await load();
    } catch (error) {
      console.error(
        "Transfer failed:",
        error
      );

      setFormError(
        error.message ||
          "Transfer failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (status === "loading") {
    return (
      <Loader label="Loading transfer information..." />
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* =====================================================
          TRANSFER FORM
      ====================================================== */}

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
        <h2 className="text-lg font-semibold text-slate-900">
          Fund Transfer
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a transfer type to enter
          only the required details.
        </p>

        {/* ERROR */}

        {formError && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {formError}
          </div>
        )}

        {/* SUCCESS */}

        {formSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {formSuccess}
          </div>
        )}

        {/* NO ACTIVE ACCOUNT */}

        {activeAccounts.length === 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            You do not have an active account
            available for transfers.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          {/* =================================================
              TRANSFER TYPE
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Transfer Type
            </label>

            <select
              name="transferType"
              value={form.transferType}
              onChange={
                handleTransferTypeChange
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option
                value={
                  TRANSFER_TYPES.UPI
                }
              >
                UPI Transfer
              </option>

              <option
                value={
                  TRANSFER_TYPES.IMPS
                }
              >
                IMPS
              </option>

              <option
                value={
                  TRANSFER_TYPES.NEFT
                }
              >
                NEFT
              </option>

              <option
                value={
                  TRANSFER_TYPES.RTGS
                }
              >
                RTGS
              </option>

              <option
                value={
                  TRANSFER_TYPES.SELF
                }
              >
                Self Transfer
              </option>
            </select>
          </div>

          {/* =================================================
              FROM ACCOUNT
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              From Account
            </label>

            <select
              name="fromAccountId"
              value={form.fromAccountId}
              onChange={handleChange}
              disabled={
                activeAccounts.length === 0
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            >
              <option value="">
                Select active account
              </option>

              {activeAccounts.map(
                (account) => (
                  <option
                    key={account._id}
                    value={account._id}
                  >
                    {account.accountType} —
                    ••••{" "}
                    {account.accountNumber.slice(
                      -4
                    )}{" "}
                    (₹
                    {Number(
                      account.balance || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                    )
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-slate-400">
              Only active accounts can
              send money.
            </p>
          </div>

          {/* =================================================
              UPI DETAILS
          ================================================== */}

          {form.transferType ===
            TRANSFER_TYPES.UPI && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="mb-3 text-xs font-medium text-blue-700">
                UPI Transfer Details
              </p>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                Recipient UPI ID
              </label>

              <input
                name="recipientUpiId"
                value={
                  form.recipientUpiId
                }
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="example@upi"
              />
            </div>
          )}

          {/* =================================================
              IMPS / NEFT / RTGS
          ================================================== */}

          {(form.transferType ===
            TRANSFER_TYPES.IMPS ||
            form.transferType ===
              TRANSFER_TYPES.NEFT ||
            form.transferType ===
              TRANSFER_TYPES.RTGS) && (
            <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-700">
                {form.transferType} Bank
                Transfer Details
              </p>

              {/* Recipient Name */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Recipient Name
                </label>

                <input
                  name="recipientName"
                  value={
                    form.recipientName
                  }
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Enter recipient name"
                />
              </div>

              {/* Account Number */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Recipient Account Number
                </label>

                <input
                  name="recipientAccountNumber"
                  value={
                    form.recipientAccountNumber
                  }
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                  placeholder="Enter account number"
                />
              </div>

              {/* IFSC */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  IFSC Code
                </label>

                <input
                  name="recipientIfsc"
                  value={
                    form.recipientIfsc
                  }
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase"
                  placeholder="Example: SBIN0001234"
                  maxLength={11}
                />
              </div>
            </div>
          )}

          {/* =================================================
              SELF TRANSFER
          ================================================== */}

          {form.transferType ===
            TRANSFER_TYPES.SELF && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="mb-3 text-xs font-medium text-emerald-700">
                Transfer between your own
                accounts
              </p>

              <label className="mb-1 block text-sm font-medium text-slate-700">
                To Account
              </label>

              <select
                name="toAccountId"
                value={form.toAccountId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">
                  Select destination account
                </option>

                {activeAccounts
                  .filter(
                    (account) =>
                      account._id !==
                      form.fromAccountId
                  )
                  .map((account) => (
                    <option
                      key={account._id}
                      value={account._id}
                    >
                      {account.accountType} —
                      ••••{" "}
                      {account.accountNumber.slice(
                        -4
                      )}{" "}
                      (₹
                      {Number(
                        account.balance || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                      )
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* =================================================
              AMOUNT
          ================================================== */}

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
                value={form.amount}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* =================================================
              TRANSACTION PIN
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Transaction PIN
            </label>

            <input
              name="transactionPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={form.transactionPin}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  transactionPin:
                    event.target.value.replace(
                      /\D/g,
                      ""
                    ),
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm tracking-[0.4em] outline-none focus:border-brand-500"
              placeholder="••••"
            />

            <p className="mt-1 text-xs text-slate-400">
              Enter the 4-digit PIN you created
              when activating your card.
            </p>
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================== */}

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
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="What's this transfer for?"
              maxLength={200}
            />
          </div>

          {/* =================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"
            disabled={
              submitting ||
              activeAccounts.length === 0
            }
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Processing..."
              : `Send ${form.transferType} Transfer`}
          </button>
        </form>
      </div>

      {/* =====================================================
          TRANSFER HISTORY
      ====================================================== */}

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Transfer History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your previous transfers.
          </p>
        </div>

        {transfers.length === 0 ? (
          <EmptyState
            title="No transfers yet"
            message="Your sent and received transfers will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {transfers.map(
              (transfer) => {
                const isSender =
                  transfer.sender?._id ===
                    user?._id ||
                  transfer.sender ===
                    user?._id;

                return (
                  <li
                    key={transfer._id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-800">
                          {isSender
                            ? `To ${
                                transfer
                                  .recipient
                                  ?.name ||
                                transfer.recipientName ||
                                "recipient"
                              }`
                            : `From ${
                                transfer
                                  .sender
                                  ?.name ||
                                "sender"
                              }`}
                        </p>

                        {transfer.transferType && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {
                              transfer.transferType
                            }
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {transfer.createdAt
                          ? new Date(
                              transfer.createdAt
                            ).toLocaleString()
                          : "Date unavailable"}

                        {transfer.referenceNumber && (
                          <>
                            {" "}
                            · Ref:{" "}
                            {
                              transfer.referenceNumber
                            }
                          </>
                        )}
                      </p>

                      {transfer.description && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {
                            transfer.description
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 font-semibold ${
                        isSender
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {isSender ? "-" : "+"}
                      ₹
                      {Number(
                        transfer.amount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </li>
                );
              }
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Transfers;