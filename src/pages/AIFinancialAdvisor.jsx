import { useNavigate } from "react-router-dom";

import {
  FaRobot,
  FaChartLine,
  FaPiggyBank,
  FaLightbulb,
  FaArrowLeft,
} from "react-icons/fa";

export default function AIFinancialAdvisor() {
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

      <div className="flex items-center gap-4">

        <div className="bg-purple-600 text-white p-4 rounded-2xl">
          <FaRobot size={25} />
        </div>

        <div>

          <h1 className="text-3xl font-bold text-slate-800">
            AI Financial Advisor
          </h1>

          <p className="text-slate-500">
            Personalized financial insights and recommendations.
          </p>

        </div>

      </div>

      {/* Features */}

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <FaChartLine className="text-blue-600 text-3xl" />

          <h3 className="font-bold text-lg mt-4">
            Spending Analysis
          </h3>

          <p className="text-slate-500 text-sm mt-2">
            Analyze your income and expenses to identify spending patterns.
          </p>

        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <FaPiggyBank className="text-green-600 text-3xl" />

          <h3 className="font-bold text-lg mt-4">
            Savings Recommendation
          </h3>

          <p className="text-slate-500 text-sm mt-2">
            Get suggestions to improve your monthly savings.
          </p>

        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <FaLightbulb className="text-yellow-500 text-3xl" />

          <h3 className="font-bold text-lg mt-4">
            Smart Recommendations
          </h3>

          <p className="text-slate-500 text-sm mt-2">
            Receive personalized recommendations based on your financial activity.
          </p>

        </div>

      </div>

      {/* AI Insight */}

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-3xl p-8 mt-8">

        <h2 className="text-2xl font-bold">
          Today's AI Insight
        </h2>

        <p className="mt-3 text-purple-100">
          Add your transactions and budget information to receive personalized
          financial recommendations.
        </p>

      </div>

    </div>
  );
}