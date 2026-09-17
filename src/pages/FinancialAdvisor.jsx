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
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <Loader label="Analyzing your finances..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Financial Advisor</h1>
          <p className="text-sm text-slate-500">Personalized suggestions based on your real financial data.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {!result?.configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <FiCpu className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <p className="font-medium text-amber-800">
            {result?.message ||
              "AI Financial Advisor is currently unavailable because the AI service is not configured."}
          </p>
          <p className="mt-2 text-sm text-amber-700">
            Set AI_API_KEY and AI_MODEL in the backend .env file to enable this feature.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="whitespace-pre-line text-sm text-slate-700">{result.advice}</div>
        </div>
      )}

      {result?.snapshot && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="mt-1 font-bold text-slate-900">
              ₹{result.snapshot.totalBalance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Income</p>
            <p className="mt-1 font-bold text-emerald-600">
              ₹{result.snapshot.totalIncome.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Expenses</p>
            <p className="mt-1 font-bold text-red-500">
              ₹{result.snapshot.totalExpenses.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Savings</p>
            <p className="mt-1 font-bold text-brand-700">
              ₹{result.snapshot.totalSavings.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAdvisor;
