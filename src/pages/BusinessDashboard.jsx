import {
  FiBriefcase,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";

import Dashboard from "./Dashboard";

const BusinessDashboard = () => {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <FiBriefcase className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Business Banking
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage your business accounts,
              transactions, transfers, loans and
              financial reports.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <FiBriefcase className="h-4 w-4 text-emerald-600" />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Banking
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Business Accounts
            </p>
          </div>

          <div className="rounded-xl bg-white p-3">
            <FiTrendingUp className="h-4 w-4 text-emerald-600" />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Performance
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Business Analytics
            </p>
          </div>

          <div className="rounded-xl bg-white p-3">
            <FiFileText className="h-4 w-4 text-emerald-600" />

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Reporting
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Business Reports
            </p>
          </div>
        </div>
      </div>

      <Dashboard />
    </div>
  );
};

export default BusinessDashboard;