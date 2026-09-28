import {
  FiBookOpen,
  FiDollarSign,
  FiTrendingUp,
  FiTarget,
  FiArrowRight,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import Dashboard from "./Dashboard";

const StudentDashboard = () => {
  return (
    <div className="space-y-5">

      {/* ==================================================
          STUDENT HEADER
      ================================================== */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-4">

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
            <FiBookOpen className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
              Student Banking
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Your Student Financial Center
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage your college expenses,
              savings, budget and education
              finances from one place.
            </p>
          </div>
        </div>

        {/* ==================================================
            STUDENT QUICK ACTIONS
        ================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            to="/expenses"
            className="group rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FiDollarSign className="h-5 w-5 text-blue-600" />

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Spending
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Student Expenses
            </p>

            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
              Manage
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/budget"
            className="group rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FiTrendingUp className="h-5 w-5 text-blue-600" />

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Planning
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Student Budget
            </p>

            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
              Manage
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/loans"
            className="group rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FiBookOpen className="h-5 w-5 text-blue-600" />

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Education
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Education Loans
            </p>

            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
              View
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/student-profile"
            className="group rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FiTarget className="h-5 w-5 text-blue-600" />

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Profile
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Student Details
            </p>

            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
              View
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </div>
          </Link>

        </div>
      </section>

      {/* ==================================================
          EXISTING LIVE BANKING DASHBOARD
      ================================================== */}

      <Dashboard />

    </div>
  );
};

export default StudentDashboard;