import { useState } from "react";
import {
  FaReceipt,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaRupeeSign,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function ReceiptScanner() {

  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
  };

  const scanReceipt = () => {
    if (!file) {
      alert("Please upload a receipt first.");
      return;
    }

    setScanning(true);

    setTimeout(() => {

      setScanning(false);

      setResult({
        merchant: "Demo Store",
        amount: 2499,
        date: "05 Aug 2026",
        category: "Shopping",
      });

    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="OCR Receipt Scanner"
          description="Upload a receipt and extract transaction information automatically."
        />

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Upload */}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">

            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
              <FaReceipt />
            </div>

            <h2 className="text-xl font-bold mt-5">
              Upload Receipt
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Supported formats: JPG, PNG and PDF.
            </p>

            <label className="mt-7 border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">

              <FaCloudUploadAlt className="text-4xl text-blue-500" />

              <p className="font-medium mt-4">
                Click to upload receipt
              </p>

              <p className="text-xs text-slate-400 mt-2">
                Maximum file size: 10 MB
              </p>

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFile}
                className="hidden"
              />

            </label>

            {file && (
              <div className="mt-5 bg-slate-50 rounded-xl p-4">

                <p className="text-sm font-medium">
                  Selected File
                </p>

                <p className="text-sm text-slate-500 mt-1 truncate">
                  {file.name}
                </p>

              </div>
            )}

            <button
              onClick={scanReceipt}
              disabled={scanning}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl p-4 font-semibold transition"
            >
              {scanning
                ? "Scanning Receipt..."
                : "Scan Receipt"}
            </button>

          </div>

          {/* Result */}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">

            <h2 className="text-xl font-bold">
              Extracted Information
            </h2>

            {!result ? (

              <div className="h-80 flex flex-col items-center justify-center text-center">

                <FaReceipt className="text-5xl text-slate-200" />

                <p className="text-slate-500 mt-5">
                  Upload and scan a receipt to see
                  extracted information here.
                </p>

              </div>

            ) : (

              <div className="mt-7 space-y-5">

                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl">

                  <FaCheckCircle className="text-green-600" />

                  <p className="text-sm text-green-700">
                    Receipt successfully processed.
                  </p>

                </div>

                <ReceiptInfo
                  label="Merchant"
                  value={result.merchant}
                />

                <ReceiptInfo
                  label="Amount"
                  value={`₹${result.amount.toLocaleString("en-IN")}`}
                />

                <ReceiptInfo
                  label="Date"
                  value={result.date}
                />

                <ReceiptInfo
                  label="Category"
                  value={result.category}
                />

                <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 font-semibold">
                  Add to Transactions
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

function ReceiptInfo({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}