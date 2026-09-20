import { useEffect, useState } from "react";
import { FiCpu, FiRefreshCw } from "react-icons/fi";
import { getFinancialAdvice } from "../services/aiService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";

const FinancialAdvisor = () => {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const data = await getFinancialAdvice();

      setResult(data);
      setStatus("success");
    } catch (err) {
      console.error(
        "[FinancialAdvisor] Failed to load advice:",
        err
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") {
    return <Loader label="Analyzing your finances..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            AI Financial Advisor
          </h1>

          <p className="text-sm text-slate-500">
            Personalized suggestions based on your real financial data.
          </p>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* AI Result / Configuration Message */}
      {!result?.configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <FiCpu className="mx-auto mb-3 h-8 w-8 text-amber-500" />

          <p className="font-medium text-amber-800">
            {result?.message ||
              "AI Financial Advisor is currently unavailable."}
          </p>

          <p className="mt-2 text-sm text-amber-700">
            Make sure the Gemini API key is configured in the backend
            environment.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {result.advice}
          </div>
        </div>
      )}

      {/* Financial Snapshot */}
      {result?.snapshot && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Balance */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Balance
            </p>

            <p className="mt-1 font-bold text-slate-900">
              ₹
              {(result.snapshot.totalBalance ?? 0).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          {/* Income */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Income
            </p>

            <p className="mt-1 font-bold text-emerald-600">
              ₹
              {(result.snapshot.totalIncome ?? 0).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          {/* Expenses */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Expenses
            </p>

            <p className="mt-1 font-bold text-red-500">
              ₹
              {(result.snapshot.totalExpenses ?? 0).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          {/* Savings */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Savings
            </p>

            <p className="mt-1 font-bold text-brand-700">
              ₹
              {(result.snapshot.totalSavings ?? 0).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAdvisor;