import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaWallet,
  FaChartPie,
  FaPiggyBank,
} from "react-icons/fa";

export default function Budget() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-5 lg:p-8">

      {/* Back Button */}

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-blue-600 font-medium mb-6 hover:text-blue-800 transition"
      >
        <FaArrowLeft />
        Back to Dashboard
      </button>

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Budget Planner
        </h1>

        <p className="text-slate-500 mt-2">
          Create and manage your monthly budget.
        </p>
      </div>

      {/* Budget Statistics */}

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {/* Income */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <FaWallet />
          </div>

          <h3 className="font-semibold text-slate-700 mt-4">
            Monthly Income
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹0
          </p>

        </div>

        {/* Budget */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <FaChartPie />
          </div>

          <h3 className="font-semibold text-slate-700 mt-4">
            Monthly Budget
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹0
          </p>

        </div>

        {/* Remaining */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <FaPiggyBank />
          </div>

          <h3 className="font-semibold text-slate-700 mt-4">
            Remaining Budget
          </h3>

          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹0
          </p>

        </div>

      </div>

      {/* Budget Categories */}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-8">

        <h2 className="text-xl font-bold text-slate-800">
          Budget Categories
        </h2>

        <p className="text-slate-500 mt-2">
          Set spending limits for different categories and manage your monthly expenses.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">

          <BudgetCategory
            name="Food"
            amount="₹0"
          />

          <BudgetCategory
            name="Travel"
            amount="₹0"
          />

          <BudgetCategory
            name="Shopping"
            amount="₹0"
          />

          <BudgetCategory
            name="Entertainment"
            amount="₹0"
          />

        </div>

      </div>

    </div>
  );
}

function BudgetCategory({ name, amount }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5">

      <p className="text-sm text-slate-500">
        {name}
      </p>

      <p className="text-xl font-bold text-slate-800 mt-2">
        {amount}
      </p>

    </div>
  );
}