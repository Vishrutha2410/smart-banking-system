import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCreditCard,
  FiFileText,
  FiList,
  FiPlus,
  FiSend,
  FiTrendingUp,
  FiBriefcase,
} from "react-icons/fi";
import { getDashboardData } from "../services/dashboardService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const StatCard = ({ label, value, icon: Icon, tone = "neutral" }) => {
  const toneClasses = {
    neutral: "bg-slate-50 text-slate-700",
    positive: "bg-emerald-50 text-emerald-700",
    negative: "bg-red-50 text-red-600",
    accent: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="sb-stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
            {formatCurrency(value)}
          </p>
        </div>

        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

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

  if (status === "loading") {
    return <Loader label="Loading your dashboard..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  if (!data) {
    return null;
  }

  const spendingTotal = data.spendingByCategory.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return (
    <div className="space-y-6">
      <section className="sb-welcome">
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">
              Financial overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome, {data.user.name}
            </h1>

            <p className="mt-1.5 max-w-xl text-sm text-slate-400">
              Here&apos;s your financial overview for this month.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/transfers"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <FiSend className="h-3.5 w-3.5" />
              Transfer
            </Link>

            <Link
              to="/accounts"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-teal-300"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Account
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={data.totalBalance}
          icon={FiBriefcase}
          tone="accent"
        />

        <StatCard
          label="Income this month"
          value={data.totalIncome}
          icon={FiArrowUpRight}
          tone="positive"
        />

        <StatCard
          label="Expenses this month"
          value={data.totalExpenses}
          icon={FiArrowDownRight}
          tone="negative"
        />

        <StatCard
          label="Savings this month"
          value={data.totalSavings}
          icon={FiTrendingUp}
          tone="positive"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Accounts",
            value: data.accountCount,
            icon: FiBriefcase,
          },
          {
            label: "Cards",
            value: data.cardCount,
            icon: FiCreditCard,
          },
          {
            label: "Active loans",
            value: data.activeLoanCount,
            icon: FiFileText,
          },
        ].map((item) => (
          <div key={item.label} className="sb-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <item.icon className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  {item.label}
                </p>

                <p className="mt-0.5 text-lg font-extrabold text-slate-900">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="sb-section-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="sb-section-title">Recent transactions</h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Your latest account activity
              </p>
            </div>

            <Link
              to="/transactions"
              className="text-xs font-bold text-brand-700 hover:underline"
            >
              View all
            </Link>
          </div>

          {data.recentTransactions.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No transactions yet"
                message="Your recent activity will appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentTransactions.map((t) => {
                const incoming =
                  t.type === "income" || t.category === "Transfer In";

                return (
                  <li
                    key={t._id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          incoming
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {incoming ? (
                          <FiArrowDownRight className="h-4 w-4" />
                        ) : (
                          <FiArrowUpRight className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {t.description || t.category}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {new Date(t.date).toLocaleDateString()} ·{" "}
                          {t.category}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-extrabold ${
                        incoming ? "text-emerald-700" : "text-slate-800"
                      }`}
                    >
                      {incoming ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sb-section-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="sb-section-title">Your accounts</h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Available balances
            </p>
          </div>

          {data.accounts.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No accounts yet" />
            </div>
          ) : (
            <ul className="space-y-2 p-3">
              {data.accounts.map((a) => (
                <li
                  key={a._id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {a.accountType} Account
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        •••• {a.accountNumber.slice(-4)}
                      </p>
                    </div>

                    <FiCreditCard className="h-4 w-4 text-slate-400" />
                  </div>

                  <p className="mt-3 text-lg font-extrabold tracking-tight text-slate-900">
                    {formatCurrency(a.balance)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="sb-section-card p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="sb-section-title">Spending by category</h2>

              <p className="mt-0.5 text-xs text-slate-400">This month</p>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Total {formatCurrency(spendingTotal)}
            </span>
          </div>

          {data.spendingByCategory.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No spending recorded yet" />
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {data.spendingByCategory.map((c) => {
                const percentage = spendingTotal
                  ? Math.min(
                      100,
                      (Number(c.total) / spendingTotal) * 100
                    )
                  : 0;

                return (
                  <li key={c.category}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-600">
                        {c.category}
                      </span>

                      <span className="font-bold text-slate-800">
                        {formatCurrency(c.total)}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sb-section-card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <FiList className="h-4 w-4" />
            </div>

            <div>
              <h2 className="sb-section-title">Quick access</h2>

              <p className="text-xs text-slate-400">
                Common banking actions
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              to="/transactions"
              className="rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            >
              Transactions
            </Link>

            <Link
              to="/cards"
              className="rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            >
              Cards
            </Link>

            <Link
              to="/budget"
              className="rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            >
              Budget
            </Link>

            <Link
              to="/analytics"
              className="rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            >
              Analytics
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;