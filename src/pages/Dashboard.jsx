import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardData } from "../services/dashboardService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">₹{value.toLocaleString("en-IN")}</p>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error

  const load = async () => {
    setStatus("loading");
    try {
      const res = await getDashboardData();
      setData(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <Loader label="Loading your dashboard..." />;
  if (status === "error") return <ErrorState onRetry={load} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {data.user.name}</h1>
        <p className="text-sm text-slate-500">Here's your financial overview this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Balance" value={data.totalBalance} />
        <StatCard label="Income (this month)" value={data.totalIncome} />
        <StatCard label="Expenses (this month)" value={data.totalExpenses} />
        <StatCard label="Savings (this month)" value={data.totalSavings} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Accounts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.accountCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cards</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.cardCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Loans</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.activeLoanCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <EmptyState title="No transactions yet" message="Your recent activity will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentTransactions.map((t) => (
                <li key={t._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{t.description || t.category}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.date).toLocaleDateString()} · {t.category}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      t.type === "income" || t.category === "Transfer In"
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {t.type === "income" || t.category === "Transfer In" ? "+" : "-"}₹
                    {t.amount.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Accounts</h2>
          {data.accounts.length === 0 ? (
            <EmptyState title="No accounts yet" />
          ) : (
            <ul className="space-y-3">
              {data.accounts.map((a) => (
                <li key={a._id} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">{a.accountType} Account</p>
                  <p className="text-xs text-slate-400">•••• {a.accountNumber.slice(-4)}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    ₹{a.balance.toLocaleString("en-IN")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Spending by Category (this month)</h2>
        {data.spendingByCategory.length === 0 ? (
          <EmptyState title="No spending recorded yet" />
        ) : (
          <ul className="space-y-2">
            {data.spendingByCategory.map((c) => (
              <li key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.category}</span>
                <span className="font-medium text-slate-900">
                  ₹{c.total.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
