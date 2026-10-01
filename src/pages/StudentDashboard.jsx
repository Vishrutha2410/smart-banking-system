import {
  useEffect,
  useState,
} from "react";

import {
  FiBookOpen,
  FiDollarSign,
  FiTrendingUp,
  FiTarget,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import {
  getDashboardData,
} from "../services/dashboardService";

import {
  getStudentProfile,
} from "../services/studentService";

import {
  getBudgets,
} from "../services/budgetService";

import {
  getLoans,
} from "../services/loanService";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;

const StudentDashboard = () => {
  const [dashboard, setDashboard] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [budgets, setBudgets] =
    useState([]);

  const [loans, setLoans] =
    useState([]);

  const [status, setStatus] =
    useState("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const [
        dashboardData,
        studentProfile,
        budgetData,
        loanData,
      ] = await Promise.all([
        getDashboardData(),
        getStudentProfile(),
        getBudgets(),
        getLoans(),
      ]);

      setDashboard(
        dashboardData || null
      );

      setProfile(
        studentProfile || null
      );

      setBudgets(
        Array.isArray(budgetData)
          ? budgetData
          : []
      );

      setLoans(
        Array.isArray(loanData)
          ? loanData
          : []
      );

      setStatus("success");
    } catch (error) {
      console.error(
        "[StudentDashboard] Failed to load:",
        error
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") {
    return (
      <Loader label="Loading your student dashboard..." />
    );
  }

  if (status === "error") {
    return (
      <ErrorState onRetry={load} />
    );
  }

  if (!dashboard) {
    return (
      <EmptyState
        title="Student dashboard unavailable"
        message="We could not load your banking information."
      />
    );
  }

  const totalBalance =
    Number(
      dashboard.totalBalance
    ) || 0;

  const monthlyIncome =
    Number(
      dashboard.totalIncome
    ) || 0;

  const monthlyExpenses =
    Number(
      dashboard.totalExpenses
    ) || 0;

  const monthlySavings =
    Number(
      dashboard.totalSavings
    ) || 0;

  const allowance =
    Number(
      profile?.monthlyAllowance
    ) || 0;

  const savingsTarget =
    Number(
      profile?.savingsGoalTarget
    ) || 0;

  const savingsProgress =
    savingsTarget > 0
      ? Math.min(
          (monthlySavings /
            savingsTarget) *
            100,
          100
        )
      : 0;

  const pendingLoans =
    loans.filter(
      (loan) =>
        String(
          loan.status || ""
        ).toUpperCase() ===
        "PENDING"
    );

  const educationLoans =
    loans.filter(
      (loan) =>
        loan.loanType ===
        "Education Loan"
    );

  const activeBudgets =
    budgets.filter(
      (budget) =>
        Number(
          budget.monthlyLimit
        ) > 0
    );

  return (
    <div className="space-y-6">

      {/* ==================================================
          STUDENT HEADER
      ================================================== */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
              <FiBookOpen className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Student Banking
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {profile?.collegeName &&
                profile.collegeName !==
                  "Not provided"
                  ? profile.collegeName
                  : "Your Student Financial Center"}
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                {profile?.course &&
                profile.course !==
                  "Not provided"
                  ? `${profile.course}${
                      profile.yearOfStudy
                        ? ` · ${profile.yearOfStudy}`
                        : ""
                    }`
                  : "Manage your education, expenses, budget and savings."}
              </p>

              {profile?.studentId &&
                profile.studentId !==
                  "Not provided" && (
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Student ID:{" "}
                    {profile.studentId}
                  </p>
                )}
            </div>
          </div>

          <Link
            to="/student-profile"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-100"
          >
            Student Profile
            <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ==================================================
          MAIN STUDENT STATS
      ================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Balance"
          value={currency(totalBalance)}
          icon={FiCreditCard}
        />

        <StatCard
          label="This Month Spending"
          value={currency(monthlyExpenses)}
          icon={FiArrowDownRight}
        />

        <StatCard
          label="This Month Savings"
          value={currency(monthlySavings)}
          icon={FiTrendingUp}
        />

        <StatCard
          label="Monthly Allowance"
          value={currency(allowance)}
          icon={FiDollarSign}
        />

      </section>

      {/* ==================================================
          STUDENT QUICK ACTIONS
      ================================================== */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Student Finance
          </h2>

          <p className="text-sm text-slate-500">
            Manage the financial areas most useful
            for your student life.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <QuickAction
            to="/expenses"
            icon={FiDollarSign}
            title="Student Expenses"
            description="Track food, travel, education and daily spending."
          />

          <QuickAction
            to="/budget"
            icon={FiTrendingUp}
            title="Student Budget"
            description="Set monthly limits for your college expenses."
          />

          <QuickAction
            to="/loans"
            icon={FiBookOpen}
            title="Education Loans"
            description="Apply for and track education loan applications."
          />

          <QuickAction
            to="/analytics"
            icon={FiTarget}
            title="Spending Analytics"
            description="Understand where your monthly money is going."
          />

        </div>
      </section>

      {/* ==================================================
          FINANCIAL OVERVIEW
      ================================================== */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* SAVINGS GOAL */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Savings Goal
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {profile?.savingsGoalName ||
                  "Set a savings goal"}
              </h2>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTarget />
            </div>
          </div>

          {savingsTarget > 0 ? (
            <>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {currency(
                      savingsTarget
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Target amount
                  </p>
                </div>

                <p className="text-sm font-bold text-emerald-600">
                  {Math.round(
                    savingsProgress
                  )}
                  %
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${savingsProgress}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Current monthly savings:{" "}
                <span className="font-semibold text-slate-700">
                  {currency(
                    monthlySavings
                  )}
                </span>
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Create a savings goal in your
                student profile to track your
                progress here.
              </p>

              <Link
                to="/student-profile"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700"
              >
                Set savings goal
                <FiArrowRight />
              </Link>
            </div>
          )}
        </div>

        {/* MONTHLY MONEY */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Monthly Money
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Income & Spending
              </h2>
            </div>

            <FiTrendingUp className="h-5 w-5 text-brand-600" />
          </div>

          <div className="mt-5 space-y-4">

            <MoneyRow
              label="Income"
              value={monthlyIncome}
              positive
              icon={FiArrowUpRight}
            />

            <MoneyRow
              label="Expenses"
              value={monthlyExpenses}
              icon={FiArrowDownRight}
            />

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  Available after expenses
                </span>

                <span
                  className={`text-lg font-extrabold ${
                    monthlySavings >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {currency(
                    monthlySavings
                  )}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          BUDGETS + LOANS
      ================================================== */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* BUDGETS */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Student Budgets
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Your current budget limits
              </p>
            </div>

            <Link
              to="/budget"
              className="text-xs font-bold text-brand-700"
            >
              Manage
            </Link>
          </div>

          {activeBudgets.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No budgets yet"
                message="Create a budget for your student expenses."
              />
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {activeBudgets
                .slice(0, 4)
                .map((budget) => {
                  const limit =
                    Number(
                      budget.monthlyLimit
                    ) || 0;

                  const spent =
                    Number(
                      budget.spent
                    ) || 0;

                  const percentage =
                    limit > 0
                      ? Math.min(
                          (spent /
                            limit) *
                            100,
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={budget._id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-700">
                          {budget.category}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          {currency(
                            spent
                          )}{" "}
                          /{" "}
                          {currency(
                            limit
                          )}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-brand-600"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* EDUCATION LOANS */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Education Loans
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Your student loan applications
              </p>
            </div>

            <Link
              to="/loans"
              className="text-xs font-bold text-brand-700"
            >
              View
            </Link>
          </div>

          {educationLoans.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No education loans"
                message="Your education loan applications will appear here."
              />
            </div>
          ) : (
            <div className="space-y-3 p-4">

              {educationLoans
                .slice(0, 4)
                .map((loan) => (
                  <div
                    key={
                      loan._id ||
                      loan.loanId
                    }
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Education Loan
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {loan.loanId ||
                            "Loan application"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {currency(
                            loan.requestedAmount
                          )}
                        </p>

                        <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                          {String(
                            loan.status ||
                              "PENDING"
                          )
                            .toLowerCase()
                            .replace(
                              "_",
                              " "
                            )}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          ACCOUNT SUMMARY
      ================================================== */}

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              My Accounts
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Your current account balances
            </p>
          </div>

          <Link
            to="/accounts"
            className="text-xs font-bold text-brand-700"
          >
            View all
          </Link>
        </div>

        {!dashboard.accounts ||
        dashboard.accounts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No accounts yet"
              message="Create a bank account to start using student banking."
            />

            <div className="mt-4 text-center">
              <Link
                to="/accounts"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white"
              >
                Create Account
                <FiArrowRight />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.accounts.map(
              (account) => (
                <div
                  key={account._id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {account.accountType}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        ••••{" "}
                        {String(
                          account.accountNumber ||
                            ""
                        ).slice(-4)}
                      </p>
                    </div>

                    <FiCreditCard className="h-4 w-4 text-slate-400" />
                  </div>

                  <p className="mt-4 text-xl font-extrabold text-slate-900">
                    {currency(
                      account.balance
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==================================================
          QUICK LINKS
      ================================================== */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Access
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          <QuickLink
            to="/transactions"
            label="Transactions"
          />

          <QuickLink
            to="/transfers"
            label="Fund Transfer"
          />

          <QuickLink
            to="/budget"
            label="Budget"
          />

          <QuickLink
            to="/analytics"
            label="Analytics"
          />

          <QuickLink
            to="/reports"
            label="Reports"
          />

          <QuickLink
            to="/student-benefits"
            label="Benefits"
          />

        </div>
      </section>
    </div>
  );
};

/* ======================================================
   COMPONENTS
====================================================== */

const StatCard = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {value}
          </p>
        </div>

        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>

      </div>
    </div>
  );
};

const QuickAction = ({
  to,
  icon: Icon,
  title,
  description,
}) => {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
    >
      <Icon className="h-5 w-5 text-blue-600" />

      <p className="mt-3 text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600">
        Open
        <FiArrowRight className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

const MoneyRow = ({
  label,
  value,
  positive = false,
  icon: Icon,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">

        <div
          className={`grid h-8 w-8 place-items-center rounded-lg ${
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-sm font-semibold text-slate-600">
          {label}
        </span>
      </div>

      <span
        className={`font-bold ${
          positive
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {currency(value)}
      </span>
    </div>
  );
};

const QuickLink = ({
  to,
  label,
}) => {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50"
    >
      {label}
    </Link>
  );
};

export default StudentDashboard;