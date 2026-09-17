import { useEffect, useRef, useState } from "react";
import { FiCamera, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { getReceipts, scanReceipt, createReceipt, deleteReceipt } from "../services/receiptService";
import { getAccounts, debitAccount } from "../services/accountService";
import { useNotifications } from "../context/NotificationContext";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ReceiptScanner = () => {
  const [receipts, setReceipts] = useState([]);
  const [status, setStatus] = useState("loading");
  const { refresh: refreshNotifications } = useNotifications();

  // Upload + scan state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanState, setScanState] = useState("idle"); // idle | scanning | scanned | error
  const [scanError, setScanError] = useState("");
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef(null);

  // Editable confirmation form (populated after a successful scan)
  const [confirmForm, setConfirmForm] = useState({
    merchant: "",
    date: "",
    amount: "",
    category: "",
    accountId: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState("");

  // Manual entry (no image, no debit) - preserved from the existing feature
  const [manualForm, setManualForm] = useState({ merchant: "", amount: "", category: "General", date: "" });
  const [manualError, setManualError] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const [receiptData, accountData] = await Promise.all([getReceipts(), getAccounts()]);
      setReceipts(receiptData.receipts);
      setAccounts(accountData);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetScan = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setScanState("idle");
    setScanError("");
    setRawText("");
    setConfirmForm({ merchant: "", date: "", amount: "", category: "", accountId: accounts[0]?._id || "" });
    setConfirmError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setScanError("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setScanError("Image must be smaller than 5MB.");
      return;
    }

    setScanError("");
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
    setScanState("idle");
  };

  const handleScan = async () => {
    if (!file) return;
    setScanState("scanning");
    setScanError("");
    try {
      const result = await scanReceipt(file);
      setRawText(result.rawText || "");
      setConfirmForm({
        merchant: result.merchant || "",
        date: result.date || "",
        amount: result.amount != null ? String(result.amount) : "",
        category: result.category || "",
        accountId: accounts[0]?._id || "",
      });
      setScanState("scanned");
    } catch (err) {
      setScanError(err.message || "Could not process this receipt image.");
      setScanState("error");
    }
  };

  const handleConfirmChange = (e) => {
    setConfirmForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirmExpense = async (e) => {
    e.preventDefault();
    setConfirmError("");
    setConfirmSuccess("");

    if (!confirmForm.merchant.trim()) {
      setConfirmError("Merchant is required.");
      return;
    }
    const numericAmount = Number(confirmForm.amount);
    if (!numericAmount || numericAmount <= 0) {
      setConfirmError("Amount must be greater than zero.");
      return;
    }
    if (!confirmForm.accountId) {
      setConfirmError("Please select an account to debit.");
      return;
    }

    setConfirming(true);
    try {
      // Reuse the existing authenticated debit API - this is the only
      // place money actually moves. Ownership, active-status, and
      // sufficient-balance checks all happen there.
      await debitAccount(
        confirmForm.accountId,
        numericAmount,
        `Receipt: ${confirmForm.merchant.trim()}`
      );

      // Log the receipt itself (separate from the transaction record).
      const receiptRes = await createReceipt({
        merchant: confirmForm.merchant.trim(),
        amount: numericAmount,
        category: confirmForm.category || "General",
        date: confirmForm.date || undefined,
        extractedText: rawText,
        source: "ocr",
      });

      setReceipts((prev) => [receiptRes.receipt, ...prev]);
      setConfirmSuccess("Expense recorded and account balance updated.");
      refreshNotifications();
      resetScan();
    } catch (err) {
      setConfirmError(err.message || "Could not record this expense.");
    } finally {
      setConfirming(false);
    }
  };

  const handleManualChange = (e) => {
    setManualForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError("");

    if (!manualForm.merchant.trim()) {
      setManualError("Merchant name is required.");
      return;
    }
    if (!manualForm.amount || Number(manualForm.amount) <= 0) {
      setManualError("Amount must be greater than zero.");
      return;
    }

    setManualSubmitting(true);
    try {
      const res = await createReceipt(manualForm);
      setReceipts((prev) => [res.receipt, ...prev]);
      setManualForm({ merchant: "", amount: "", category: "General", date: "" });
    } catch (err) {
      setManualError(err.message || "Could not save receipt.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReceipt(id);
      setReceipts((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      // no-op
    }
  };

  if (status === "loading") return <Loader label="Loading receipts..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Receipt Scanner</h1>
        <p className="text-sm text-slate-500">
          Upload a receipt photo to extract the details automatically, then confirm to record the expense.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Scan flow */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Scan a Receipt</h2>

          {confirmSuccess && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {confirmSuccess}
            </div>
          )}

          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-image-input"
            />
            {!previewUrl ? (
              <label
                htmlFor="receipt-image-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-10 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
              >
                <FiUpload className="h-6 w-6" />
                Click to upload a receipt image
                <span className="text-xs text-slate-400">JPG, PNG, or WEBP · up to 5MB</span>
              </label>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="Receipt preview" className="w-full rounded-lg border border-slate-200 object-contain" />
                <button
                  onClick={resetScan}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow hover:text-red-500"
                  aria-label="Remove image"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {scanError && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{scanError}</div>
          )}

          {file && scanState !== "scanned" && (
            <button
              onClick={handleScan}
              disabled={scanState === "scanning"}
              className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {scanState === "scanning" ? "Scanning receipt..." : "Scan Receipt"}
            </button>
          )}
        </div>

        {/* Confirmation form / manual entry */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          {scanState === "scanned" ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Review Extracted Details</h2>
              <p className="mt-1 text-xs text-slate-400">
                Fields that couldn't be confidently read are left blank - fill them in before confirming.
              </p>

              {confirmError && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{confirmError}</div>
              )}

              <form onSubmit={handleConfirmExpense} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Merchant</label>
                    <input
                      name="merchant"
                      value={confirmForm.merchant}
                      onChange={handleConfirmChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Not detected - enter manually"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={confirmForm.date}
                      onChange={handleConfirmChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      name="amount"
                      value={confirmForm.amount}
                      onChange={handleConfirmChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Not detected - enter manually"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                    <input
                      name="category"
                      value={confirmForm.category}
                      onChange={handleConfirmChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="e.g. Groceries"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Debit From Account
                  </label>
                  <select
                    name="accountId"
                    value={confirmForm.accountId}
                    onChange={handleConfirmChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.accountType} — •••• {a.accountNumber.slice(-4)} (₹{a.balance.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                {rawText && (
                  <details className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                    <summary className="cursor-pointer font-medium text-slate-600">Raw OCR text</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{rawText}</pre>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetScan}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirming || accounts.length === 0}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {confirming ? "Recording expense..." : "Confirm Expense"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Or Log a Receipt Manually</h2>
              <p className="mt-1 text-xs text-slate-400">
                This only saves a record here - it does not debit an account.
              </p>

              {manualError && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{manualError}</div>
              )}

              <form onSubmit={handleManualSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Merchant</label>
                  <input
                    name="merchant"
                    value={manualForm.merchant}
                    onChange={handleManualChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. Whole Foods"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    value={manualForm.amount}
                    onChange={handleManualChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                  <input
                    name="category"
                    value={manualForm.category}
                    onChange={handleManualChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. Groceries"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={manualForm.date}
                    onChange={handleManualChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={manualSubmitting}
                    className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {manualSubmitting ? "Saving..." : "Save Receipt Record"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Receipts</h2>
        {receipts.length === 0 ? (
          <EmptyState title="No receipts yet" icon={FiCamera} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {receipts.map((r) => (
              <li key={r._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{r.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {r.category} · {new Date(r.date).toLocaleDateString()} ·{" "}
                    {r.source === "ocr" ? "Scanned" : "Manual entry"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">
                    ₹{r.amount.toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Delete receipt"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;