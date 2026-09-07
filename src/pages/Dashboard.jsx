import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummary,
} from "../services/dashboardService";
import {
  FaArrowUp,
  FaArrowDown,
  FaPiggyBank,
  FaShieldAlt,
  FaRobot,
  FaReceipt,
  FaCreditCard,
  FaChartLine,
} from "react-icons/fa";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import BalanceCard from "../components/BalanceCard";
import StatCard from "../components/StatCard";
import RecentTransactions from "../components/RecentTransactions";
import SpendingChart from "../components/SpendingChart";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const [user, setUser] = useState(null);

useEffect(() => {

  const storedUser =
    localStorage.getItem("user");

  if (storedUser) {

    setUser(
      JSON.parse(storedUser)
    );

  }

}, []);
 useEffect(() => {

  const loadDashboard =
    async () => {

      try {

        const data =
          await getDashboardSummary();

        setDashboardData(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

  loadDashboard();

}, []);
  useEffect(() => {
  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/accounts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setAccounts(data);

    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchAccounts();
}, []);

  const mainAccount = accounts[0];

const balance = mainAccount
  ? mainAccount.balance
  : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* =========================================================
          MOBILE OVERLAY
      ========================================================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <main className="flex-1 min-w-0">

        {/* Header */}

        <DashboardHeader
          setSidebarOpen={setSidebarOpen}
        />

        {/* Dashboard Content */}

        <div className="p-5 lg:p-8">

          {/* =====================================================
              BALANCE + AI INSIGHT
          ===================================================== */}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* Balance */}

            <div className="lg:col-span-2">
              <BalanceCard
  balance={balance}
  accountNumber={
    mainAccount?.accountNumber
  }
/>
            </div>

            {/* AI Insight */}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FaRobot />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    AI Financial Insight
                  </h3>

                  <p className="text-xs text-slate-500">
                    Smart Financial Assistant
                  </p>

                </div>

              </div>

              <p className="text-sm text-slate-600 mt-5 leading-6">
                Your shopping expenses are slightly higher
                this month. Consider reducing discretionary
                purchases to improve your savings.
              </p>

              <button
                onClick={() => navigate("/financial-advisor")}
                className="text-blue-600 font-medium text-sm mt-4 hover:underline"
              >
                View AI Advisor →
              </button>

            </div>

          </div>

          {/* =====================================================
              STATISTICS
          ===================================================== */}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">

            <StatCard
              icon={<FaArrowUp />}
              title="Income"
              amount="₹45,000"
              change="+12.5%"
              positive
            />

            <StatCard
              icon={<FaArrowDown />}
              title="Expenses"
              amount="₹18,450"
              change="+4.8%"
              positive={false}
            />

            <StatCard
              icon={<FaPiggyBank />}
              title="Savings"
              amount="₹26,550"
              change="+18.2%"
              positive
            />

            <StatCard
              icon={<FaShieldAlt />}
              title="Security"
              amount="Protected"
              change="No Alerts"
              positive
            />

          </div>

          {/* =====================================================
              SPENDING CHART + QUICK ACTIONS
          ===================================================== */}

          <div className="grid xl:grid-cols-3 gap-6 mt-6">

            {/* Spending Chart */}

            <div className="xl:col-span-2">
              <SpendingChart />
            </div>

            {/* Quick Actions */}

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">

              <h3 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Manage your finances quickly
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">

                <QuickAction
                  icon={<FaArrowUp />}
                  label="Transfer"
                  onClick={() => navigate("/transfer")}
                />

                <QuickAction
                  icon={<FaCreditCard />}
                  label="Cards"
                  onClick={() => navigate("/cards")}
                />

                <QuickAction
                  icon={<FaReceipt />}
                  label="Scan Receipt"
                  onClick={() => navigate("/receipt-scanner")}
                />

                <QuickAction
                  icon={<FaChartLine />}
                  label="Analytics"
                  onClick={() => navigate("/reports")}
                />

              </div>

            </div>

          </div>

          {/* =====================================================
              RECENT TRANSACTIONS
          ===================================================== */}

          <div className="mt-6">
            <RecentTransactions />
          </div>

        </div>

      </main>

    </div>
  );
}


/* ================================================================
   QUICK ACTION COMPONENT
================================================================ */

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        bg-slate-50
        hover:bg-blue-50
        border border-slate-100
        hover:border-blue-200
        rounded-2xl
        p-4
        text-center
        transition-all
        duration-200
        cursor-pointer
      "
    >

      <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
        {icon}
      </div>

      <p className="text-sm font-medium text-slate-700 mt-3">
        {label}
      </p>

    </button>
  );
}