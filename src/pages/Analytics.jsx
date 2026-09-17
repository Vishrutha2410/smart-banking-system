import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { getAnalytics } from "../services/analyticsService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const COLORS = ["#2a5bff", "#4d7fff", "#80a9ff", "#1a3fe0", "#132a8f", "#b3ccff"];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const res = await getAnalytics();
      setData(res);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <Loader label="Crunching your numbers..." />;
  if (status === "error") return <ErrorState onRetry={load} />;
  if (!data?.hasData) {
    return <EmptyState title="No financial data available yet." message="Start recording income and expenses to see analytics here." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Insights based on your real transaction history.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Monthly Income</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            ₹{data.monthlyIncome.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Monthly Expenses</p>
          <p className="mt-1 text-2xl font-bold text-red-500">
            ₹{data.monthlyExpenses.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Savings</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">
            ₹{data.savings.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Spending by Category</h2>
          {data.spendingByCategory.length === 0 ? (
            <EmptyState title="No spending recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.spendingByCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.category}
                >
                  {data.spendingByCategory.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Top Spending Categories</h2>
          {data.topCategories.length === 0 ? (
            <EmptyState title="No spending recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topCategories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Bar dataKey="total" fill="#2a5bff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Monthly Income vs Expenses</h2>
        {data.monthlyTrends.length === 0 ? (
          <EmptyState title="No monthly trend data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Analytics;
