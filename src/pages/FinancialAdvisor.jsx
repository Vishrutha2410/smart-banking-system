import { useState } from "react";
import {
  FaRobot,
  FaPiggyBank,
  FaChartLine,
  FaWallet,
  FaLightbulb,
  FaArrowUp,
  FaShieldAlt,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function FinancialAdvisor() {
  const [goal, setGoal] = useState("");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [advice, setAdvice] = useState(null);

  const generateAdvice = (e) => {
    e.preventDefault();

    const incomeValue = Number(income);
    const expenseValue = Number(expenses);

    if (!incomeValue || !expenseValue) {
      alert("Please enter your income and expenses.");
      return;
    }

    const savings = incomeValue - expenseValue;
    const savingsRate = (savings / incomeValue) * 100;

    let recommendation;

    if (savingsRate >= 30) {
      recommendation =
        "Excellent! Your savings rate is healthy. Consider investing a portion of your surplus for long-term growth.";
    } else if (savingsRate >= 20) {
      recommendation =
        "Good financial discipline. Try increasing your savings slightly and create an emergency fund.";
    } else if (savingsRate >= 10) {
      recommendation =
        "Your savings can be improved. Review discretionary spending and create a monthly budget.";
    } else {
      recommendation =
        "Your expenses are high compared with your income. Focus on essential expenses and reduce unnecessary spending.";
    }

    setAdvice({
      savings,
      savingsRate,
      recommendation,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="AI Financial Advisor"
          description="Get personalized insights based on your financial habits."
        />

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Advisor Form */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-7">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
                <FaRobot />
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Financial Health Assessment
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter your details to receive an AI-style financial analysis.
                </p>

              </div>

            </div>

            <form
              onSubmit={generateAdvice}
              className="mt-8 space-y-5"
            >

              <div>

                <label className="text-sm font-medium text-slate-700">
                  Monthly Income
                </label>

                <div className="relative mt-2">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="45000"
                    className="w-full border border-slate-200 rounded-xl p-4 pl-9 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              <div>

                <label className="text-sm font-medium text-slate-700">
                  Monthly Expenses
                </label>

                <div className="relative mt-2">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="18000"
                    className="w-full border border-slate-200 rounded-xl p-4 pl-9 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              <div>

                <label className="text-sm font-medium text-slate-700">
                  Financial Goal
                </label>

                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="">
                    Select a goal
                  </option>

                  <option value="saving">
                    Increase Savings
                  </option>

                  <option value="investment">
                    Start Investing
                  </option>

                  <option value="emergency">
                    Build Emergency Fund
                  </option>

                  <option value="loan">
                    Pay Off Loan
                  </option>

                  <option value="budget">
                    Control Spending
                  </option>

                </select>

              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 font-semibold transition flex items-center justify-center gap-3"
              >
                <FaRobot />
                Generate Financial Advice
              </button>

            </form>

          </div>

          {/* Quick Tips */}

          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-3xl p-7">

            <FaLightbulb className="text-3xl text-yellow-300" />

            <h2 className="text-xl font-bold mt-5">
              Smart Money Tips
            </h2>

            <div className="mt-6 space-y-5">

              <Tip
                icon={<FaPiggyBank />}
                text="Try to maintain at least 3–6 months of expenses as an emergency fund."
              />

              <Tip
                icon={<FaChartLine />}
                text="Review your spending every month and identify unnecessary expenses."
              />

              <Tip
                icon={<FaShieldAlt />}
                text="Never share your banking password, PIN or OTP."
              />

            </div>

          </div>

        </div>

        {/* Result */}

        {advice && (
          <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-7">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <FaChartLine />
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Your Financial Analysis
                </h2>

                <p className="text-sm text-slate-500">
                  Personalized recommendation
                </p>

              </div>

            </div>

            <div className="grid sm:grid-cols-3 gap-5 mt-7">

              <ResultCard
                title="Estimated Savings"
                value={`₹${advice.savings.toLocaleString("en-IN")}`}
              />

              <ResultCard
                title="Savings Rate"
                value={`${advice.savingsRate.toFixed(1)}%`}
              />

              <ResultCard
                title="Financial Goal"
                value={goal || "General"}
              />

            </div>

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">

              <div className="flex gap-3">

                <FaLightbulb className="text-blue-600 mt-1" />

                <div>

                  <h3 className="font-semibold text-blue-900">
                    AI Recommendation
                  </h3>

                  <p className="text-sm text-blue-800 mt-2 leading-6">
                    {advice.recommendation}
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

function Tip({ icon, text }) {
  return (
    <div className="flex gap-3">

      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>

      <p className="text-sm text-blue-100 leading-6">
        {text}
      </p>

    </div>
  );
}

function ResultCard({ title, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}