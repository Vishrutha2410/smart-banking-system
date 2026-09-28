import {
  FiBookOpen,
  FiDollarSign,
  FiTrendingUp,
} from "react-icons/fi";

import Dashboard from "./Dashboard";

const StudentDashboard = () => {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
            <FiBookOpen className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Student Banking
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage your education expenses,
              student budget, savings and
              education loans from one place.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <FiBookOpen className="h-4 w-4 text-blue-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Education
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              Education Loans
            </p>
          </div>

          <div className="rounded-xl bg-white p-3">
            <FiDollarSign className="h-4 w-4 text-blue-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Spending
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              Student Budget
            </p>
          </div>

          <div className="rounded-xl bg-white p-3">
            <FiTrendingUp className="h-4 w-4 text-blue-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Planning
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              Financial Analytics
            </p>
          </div>
        </div>
      </div>

      <Dashboard />
    </div>
  );
};

export default StudentDashboard;