import { useEffect, useState } from "react";
import { getReports } from "../services/reportsService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const now = new Date();

const Reports = () => {
  const [period, setPeriod] = useState("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const params = { period };
      if (period === "monthly") {
        params.month = month;
        params.year = year;
      } else if (period === "yearly") {
        params.year = year;
      } else if (period === "custom") {
        if (!startDate || !endDate) {
          setStatus("success");
          setData(null);
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await getReports(params);
      setData(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, month, year]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    load();
  };

  const exportCSV = () => {
    if (!data?.transactions?.length) return;
    const header = "Date,Description,Category,Type,Amount,Reference\n";
    const rows = data.transactions
      .map(
        (t) =>
          `${new Date(t.date).toLocaleDateString()},"${t.description || ""}",${t.category},${t.type},${t.amount},${t.referenceNumber}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Generated from your real transaction history.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {period === "monthly" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {period === "yearly" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        {period === "custom" && (
          <form onSubmit={handleCustomSearch} className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Apply
            </button>
          </form>
        )}

        {data?.transactions?.length > 0 && (
          <button
            onClick={exportCSV}
            className="ml-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </button>
        )}
      </div>

      {status === "loading" && <Loader label="Generating report..." />}
      {status === "error" && <ErrorState onRetry={load} />}

      {status === "success" && !data && (
        <EmptyState title="Select a date range" message="Choose a start and end date to generate a custom report." />
      )}

      {status === "success" && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Income</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                ₹{data.totalIncome.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Expenses</p>
              <p className="mt-1 text-xl font-bold text-red-500">
                ₹{data.totalExpenses.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Savings</p>
              <p className="mt-1 text-xl font-bold text-brand-700">
                ₹{data.savings.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{data.transactionCount}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Category Breakdown</h2>
            {data.categoryBreakdown.length === 0 ? (
              <EmptyState title="No expense data for this period" />
            ) : (
              <ul className="space-y-2 text-sm">
                {data.categoryBreakdown.map((c) => (
                  <li key={c.category} className="flex items-center justify-between">
                    <span className="text-slate-600">{c.category}</span>
                    <span className="font-medium text-slate-900">
                      ₹{c.total.toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  data.transactions.map((t) => (
                    <tr key={t._id}>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{t.description || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{t.category}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        ₹{t.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
