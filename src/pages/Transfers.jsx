import { useEffect, useState } from "react";
import {
  FiSend,
  FiUser,
  FiCreditCard,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiLock,
  FiEye,
  FiArrowRight,
} from "react-icons/fi";

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
  recipientAccountNumber: "",
  recipientName: "",
  recipientIfsc: "",
  recipientUpiId: "",
  toAccountId: "",
  amount: "",
  description: "",
};

const Transfers = () => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);

  // Main success/error message popup
  const [messageModal, setMessageModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // PIN popup
  const [pinModal, setPinModal] = useState({
    open: false,
    pin: "",
    error: "",
  });

  // Recipient transfer details popup
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const activeAccounts = accounts.filter(
    (account) =>
      String(account.status || "").toLowerCase() === "active"
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [accountsData, transfersData] = await Promise.all([
        getAccounts(),
        getTransfers(),
      ]);

      const loadedAccounts = Array.isArray(accountsData)
        ? accountsData
        : [];

      setAccounts(loadedAccounts);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);

      setForm((prev) => {
        if (
          prev.fromAccountId ||
          loadedAccounts.length === 0
        ) {
          return prev;
        }

        return {
          ...prev,
          fromAccountId: loadedAccounts[0]._id,
        };
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load transfer data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      ...initialForm,
      fromAccountId:
        activeAccounts.length > 0
          ? activeAccounts[0]._id
          : "",
    });
  };

  const showMessage = (type, title, message) => {
    setMessageModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTransferTypeChange = (event) => {
    const transferType = event.target.value;

    setForm((prev) => ({
      ...prev,
      transferType,
      recipientAccountNumber: "",
      recipientName: "",
      recipientIfsc: "",
      recipientUpiId: "",
      toAccountId: "",
    }));
  };

  const handlePinChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setPinModal((prev) => ({
      ...prev,
      pin: value,
      error: "",
    }));
  };

  const validateForm = () => {
    if (!form.transferType) {
      return "Please select a transfer type.";
    }

    if (!form.fromAccountId) {
      return "Please select a source account.";
    }

    if (!form.amount || Number(form.amount) <= 0) {
      return "Please enter a valid transfer amount.";
    }

    const sourceAccount = activeAccounts.find(
      (account) => account._id === form.fromAccountId
    );

    if (!sourceAccount) {
      return "Selected source account is not available.";
    }

    if (Number(form.amount) > Number(sourceAccount.balance || 0)) {
      return "Insufficient balance in the selected account.";
    }

    if (form.transferType === TRANSFER_TYPES.UPI) {
      if (!form.recipientUpiId.trim()) {
        return "Please enter the recipient UPI ID.";
      }
    }

    if (
      [
        TRANSFER_TYPES.IMPS,
        TRANSFER_TYPES.NEFT,
        TRANSFER_TYPES.RTGS,
      ].includes(form.transferType)
    ) {
      if (!form.recipientName.trim()) {
        return "Please enter the recipient name.";
      }

      if (!form.recipientAccountNumber.trim()) {
        return "Please enter the recipient account number.";
      }

      if (!form.recipientIfsc.trim()) {
        return "Please enter the recipient IFSC.";
      }
    }

    if (form.transferType === TRANSFER_TYPES.SELF) {
      if (!form.toAccountId) {
        return "Please select the destination account.";
      }

      if (form.toAccountId === form.fromAccountId) {
        return "Source and destination accounts must be different.";
      }
    }

    return null;
  };

  const buildTransferData = (transactionPin) => {
    const transferData = {
      transferType: form.transferType,
      fromAccountId: form.fromAccountId,
      amount: Number(form.amount),
      description: form.description.trim(),
      transactionPin,
    };

    if (form.transferType === TRANSFER_TYPES.UPI) {
      transferData.recipientUpiId =
        form.recipientUpiId.trim();
    }

    if (
      [
        TRANSFER_TYPES.IMPS,
        TRANSFER_TYPES.NEFT,
        TRANSFER_TYPES.RTGS,
      ].includes(form.transferType)
    ) {
      transferData.recipientName =
        form.recipientName.trim();

      transferData.recipientAccountNumber =
        form.recipientAccountNumber.trim();

      transferData.recipientIfsc =
        form.recipientIfsc.trim().toUpperCase();
    }

    if (form.transferType === TRANSFER_TYPES.SELF) {
      transferData.toAccountId = form.toAccountId;
    }

    return transferData;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      showMessage(
        "error",
        "Transfer Cannot Continue",
        validationError
      );
      return;
    }

    setPinModal({
      open: true,
      pin: "",
      error: "",
    });
  };

  const confirmTransferWithPin = async () => {
    if (!/^\d{4}$/.test(pinModal.pin)) {
      setPinModal((prev) => ({
        ...prev,
        error: "Please enter your 4-digit transaction PIN.",
      }));
      return;
    }

    try {
      setSubmitting(true);

      const transferData = buildTransferData(
        pinModal.pin
      );

      await createTransfer(transferData);

      setPinModal({
        open: false,
        pin: "",
        error: "",
      });

      resetForm();

      await load();

      showMessage(
        "success",
        "Transfer Successful",
        "Your money has been transferred successfully."
      );
    } catch (err) {
      const status = err?.response?.status;
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to complete the transfer.";

      if (
        status === 400 &&
        errorMessage.toLowerCase().includes("pin")
      ) {
        setPinModal((prev) => ({
          ...prev,
          error: errorMessage,
        }));
      } else {
        setPinModal({
          open: false,
          pin: "",
          error: "",
        });

        showMessage(
          "error",
          "Transfer Failed",
          errorMessage
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closePinModal = () => {
    if (submitting) return;

    setPinModal({
      open: false,
      pin: "",
      error: "",
    });
  };

  /*
   * Group transfer history.
   *
   * Sent transfers are grouped by recipient.
   * Received transfers are grouped by sender.
   */
  const recipientGroups = Object.values(
    transfers.reduce((groups, transfer) => {
      const currentUserId = String(
        user?._id || user?.id || ""
      );

      const senderId = String(
        transfer?.sender?._id ||
          transfer?.sender ||
          ""
      );

      const recipientId = String(
        transfer?.recipient?._id ||
          transfer?.recipient ||
          ""
      );

      const isSender =
        senderId &&
        currentUserId &&
        senderId === currentUserId;

      let partyId;
      let partyName;
      let partyAccountNumber;
      let partyType;

      if (isSender) {
        partyId =
          recipientId ||
          transfer?.recipientName ||
          transfer?.recipientAccountNumber ||
          transfer?.recipientUpiId ||
          "recipient";

        partyName =
          transfer?.recipient?.name ||
          transfer?.recipientName ||
          transfer?.recipientUpiId ||
          "Recipient";

        partyAccountNumber =
          transfer?.toAccount?.accountNumber ||
          transfer?.recipientAccountNumber ||
          "";

        partyType = "To";
      } else {
        partyId =
          senderId ||
          transfer?.sender?.email ||
          "sender";

        partyName =
          transfer?.sender?.name ||
          transfer?.sender?.email ||
          "Sender";

        partyAccountNumber =
          transfer?.fromAccount?.accountNumber ||
          "";

        partyType = "From";
      }

      const key = `${partyType}-${partyId}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          partyName,
          partyAccountNumber,
          partyType,
          transfers: [],
          totalAmount: 0,
        };
      }

      groups[key].transfers.push(transfer);
      groups[key].totalAmount += Number(
        transfer?.amount || 0
      );

      return groups;
    }, {})
  );

  const getStatusIcon = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "success" ||
      normalized === "successful"
    ) {
      return (
        <FiCheckCircle className="text-emerald-500" />
      );
    }

    if (
      normalized === "failed" ||
      normalized === "cancelled" ||
      normalized === "rejected"
    ) {
      return (
        <FiXCircle className="text-red-500" />
      );
    }

    return (
      <FiClock className="text-amber-500" />
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const getTransferTypeLabel = (type) => {
    if (!type) return "Transfer";

    return String(type).toUpperCase();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Fund Transfer
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Transfer money securely between accounts.
        </p>
      </div>

      {/* TRANSFER FORM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiSend size={21} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Make a Transfer
            </h2>

            <p className="text-sm text-slate-500">
              Enter the transfer details below.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* TRANSFER TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Transfer Type
            </label>

            <select
              name="transferType"
              value={form.transferType}
              onChange={handleTransferTypeChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="UPI">UPI</option>
              <option value="IMPS">IMPS</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="SELF">
                Self Transfer
              </option>
            </select>
          </div>

          {/* SOURCE ACCOUNT */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              From Account
            </label>

            <select
              name="fromAccountId"
              value={form.fromAccountId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select account
              </option>

              {activeAccounts.map((account) => (
                <option
                  key={account._id}
                  value={account._id}
                >
                  {account.accountNumber} -{" "}
                  {account.accountType} -{" "}
                  {formatAmount(account.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* SELF TRANSFER */}
          {form.transferType ===
            TRANSFER_TYPES.SELF && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                To Account
              </label>

              <select
                name="toAccountId"
                value={form.toAccountId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      {account.accountNumber} -{" "}
                      {account.accountType}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* UPI */}
          {form.transferType ===
            TRANSFER_TYPES.UPI && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Recipient UPI ID
              </label>

              <input
                type="text"
                name="recipientUpiId"
                value={form.recipientUpiId}
                onChange={handleChange}
                placeholder="example@upi"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {/* BANK TRANSFER DETAILS */}
          {[
            TRANSFER_TYPES.IMPS,
            TRANSFER_TYPES.NEFT,
            TRANSFER_TYPES.RTGS,
          ].includes(form.transferType) && (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recipient Name
                </label>

                <input
                  type="text"
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="Recipient name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recipient Account Number
                </label>

                <input
                  type="text"
                  name="recipientAccountNumber"
                  value={form.recipientAccountNumber}
                  onChange={handleChange}
                  placeholder="Account number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Recipient IFSC
                </label>

                <input
                  type="text"
                  name="recipientIfsc"
                  value={form.recipientIfsc}
                  onChange={handleChange}
                  placeholder="IFSC code"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {/* AMOUNT */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="1"
              step="0.01"
              placeholder="Enter amount"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Optional description"
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSend />

            Transfer Money
          </button>
        </form>
      </div>

      {/* TRANSFER HISTORY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Transfer History
            </h2>

            <p className="text-sm text-slate-500">
              Select a recipient to view all transfers.
            </p>
          </div>

          <FiClock
            size={21}
            className="text-slate-400"
          />
        </div>

        {recipientGroups.length === 0 ? (
          <EmptyState
            title="No Transfers Yet"
            message="Your transfer history will appear here."
          />
        ) : (
          <div className="space-y-3">
            {recipientGroups.map((group) => {
              const latestTransfer =
                group.transfers[0];

              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() =>
                    setSelectedRecipient(group)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <FiUser size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {group.partyName}
                      </p>

                      <p className="text-sm text-slate-500">
                        {group.partyType}{" "}
                        {group.partyAccountNumber
                          ? `• ${group.partyAccountNumber}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {group.transfers.length}{" "}
                        transfer
                        {group.transfers.length !== 1
                          ? "s"
                          : ""}{" "}
                        • Last:{" "}
                        {formatDate(
                          latestTransfer?.createdAt ||
                            latestTransfer?.date
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatAmount(
                          group.totalAmount
                        )}
                      </p>

                      <p className="text-xs text-slate-500">
                        Total transferred
                      </p>
                    </div>

                    <FiArrowRight className="text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================
          MESSAGE MODAL
      ========================== */}
      {messageModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeMessageModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                  messageModal.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {messageModal.type === "success" ? (
                  <FiCheckCircle size={28} />
                ) : (
                  <FiAlertCircle size={28} />
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {messageModal.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {messageModal.message}
              </p>

              <button
                type="button"
                onClick={closeMessageModal}
                className={`mt-6 w-full rounded-xl px-5 py-3 font-medium text-white ${
                  messageModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          TRANSACTION PIN MODAL
      ========================== */}
      {pinModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiLock size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Enter Transaction PIN
                  </h3>

                  <p className="text-sm text-slate-500">
                    Confirm your transfer securely.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePinModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                4-Digit Transaction PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={pinModal.pin}
                onChange={handlePinChange}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    pinModal.pin.length === 4 &&
                    !submitting
                  ) {
                    confirmTransferWithPin();
                  }
                }}
                placeholder="••••"
                className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl tracking-[0.7em] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {pinModal.error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  <FiAlertCircle
                    className="shrink-0"
                  />

                  <span>{pinModal.error}</span>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Amount
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatAmount(form.amount)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Transfer Type
                  </span>

                  <span className="font-semibold text-slate-900">
                    {getTransferTypeLabel(
                      form.transferType
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closePinModal}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmTransferWithPin}
                disabled={
                  submitting ||
                  pinModal.pin.length !== 4
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          RECIPIENT DETAILS MODAL
      ========================== */}
      {selectedRecipient && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <FiUser size={21} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedRecipient.partyName}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {selectedRecipient.partyType}{" "}
                    {selectedRecipient.partyAccountNumber
                      ? `• ${selectedRecipient.partyAccountNumber}`
                      : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRecipient(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={21} />
              </button>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-slate-500">
                  Total Transfers
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selectedRecipient.transfers.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-slate-500">
                  Total Amount
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatAmount(
                    selectedRecipient.totalAmount
                  )}
                </p>
              </div>

              <div className="col-span-2 rounded-xl bg-white p-4 md:col-span-1">
                <p className="text-xs text-slate-500">
                  Recipient / Sender
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedRecipient.partyType}
                </p>
              </div>
            </div>

            {/* TRANSFER DETAILS */}
            <div className="max-h-[55vh] overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedRecipient.transfers.map(
                  (transfer, index) => (
                    <div
                      key={
                        transfer._id ||
                        transfer.referenceNumber ||
                        index
                      }
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      {/* TOP ROW */}
                      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row">
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(
                              transfer.status
                            )}

                            <span className="font-semibold text-slate-900">
                              {getTransferTypeLabel(
                                transfer.transferType
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(
                              transfer.createdAt ||
                                transfer.date
                            )}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatAmount(
                              transfer.amount
                            )}
                          </p>

                          <p className="text-xs capitalize text-slate-500">
                            {transfer.status ||
                              "Pending"}
                          </p>
                        </div>
                      </div>

                      {/* DETAILS GRID */}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">
                            Reference ID
                          </p>

                          <p className="mt-1 break-all text-sm font-medium text-slate-900">
                            {transfer.referenceNumber ||
                              transfer._id ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Transfer Type
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {getTransferTypeLabel(
                              transfer.transferType
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Sender Name
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {transfer.sender?.name ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Sender Account
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {transfer.fromAccount
                              ?.accountNumber ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Recipient Name
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {transfer.recipient
                              ?.name ||
                              transfer.recipientName ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Recipient Account
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {transfer.toAccount
                              ?.accountNumber ||
                              transfer.recipientAccountNumber ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            IFSC
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {transfer.recipientIfsc ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            UPI ID
                          </p>

                          <p className="mt-1 break-all text-sm font-medium text-slate-900">
                            {transfer.recipientUpiId ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatAmount(
                              transfer.amount
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                            {transfer.status ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      {transfer.description && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Description
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {transfer.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedRecipient(null)
                }
                className="w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;