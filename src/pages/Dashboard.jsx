import { useState } from "react";
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaCreditCard,
  FaRobot,
  FaBell,
  FaUserCircle,
  FaChartLine,
  FaShieldAlt,
  FaPiggyBank,
  FaReceipt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const transactions = [
    {
      name: "Salary Credit",
      category: "Income",
      amount: "+ ₹45,000",
      type: "income",
      date: "Aug 05, 2026",
    },
    {
      name: "Amazon",
      category: "Shopping",
      amount: "- ₹2,499",
      type: "expense",
      date: "Aug 04, 2026",
    },
    {
      name: "Swiggy",
      category: "Food",
      amount: "- ₹650",
      type: "expense",
      date: "Aug 03, 2026",
    },
    {
      name: "Uber",
      category: "Travel",
      amount: "- ₹420",
      type: "expense",
      date: "Aug 02, 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          fixed lg:static
          top-0 left-0
          h-screen
          w-72
          bg-slate-950
          text-white
          z-40
          transform
          transition-transform
          duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >

        {/* Logo */}

        <div className="h-20 flex items-center px-7 border-b border-white/10">

          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
            <FaWallet />
          </div>

          <div className="ml-3">

            <h1 className="font-bold text-lg">
              SmartBank AI
            </h1>

            <p className="text-xs text-slate-400">
              Smart Banking
            </p>

          </div>

          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>

        </div>

        {/* Navigation */}

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

          <SidebarItem
            icon={<FaChartLine />}
            label="Dashboard"
            active
          />

          <SidebarItem
            icon={<FaWallet />}
            label="Accounts"
          />

          <SidebarItem
            icon={<FaExchangeAlt />}
            label="Transactions"
          />

          <SidebarItem
            icon={<FaArrowUp />}
            label="Transfer Money"
          />

          <SidebarItem
            icon={<FaCreditCard />}
            label="Cards"
          />

          <SidebarItem
            icon={<FaPiggyBank />}
            label="Loans"
          />

          <SidebarItem
            icon={<FaChartLine />}
            label="Analytics"
          />

          <SidebarItem
            icon={<FaPiggyBank />}
            label="Budget"
          />

          <div className="pt-5 pb-2 px-3 text-xs uppercase tracking-wider text-slate-500">
            AI Services
          </div>

          <SidebarItem
            icon={<FaRobot />}
            label="AI Financial Advisor"
          />

          <SidebarItem
            icon={<FaRobot />}
            label="AI Chatbot"
          />

          <SidebarItem
            icon={<FaReceipt />}
            label="Receipt Scanner"
          />

          <div className="pt-5 pb-2 px-3 text-xs uppercase tracking-wider text-slate-500">
            Account
          </div>

          <SidebarItem
            icon={<FaBell />}
            label="Notifications"
          />

          <SidebarItem
            icon={<FaUserCircle />}
            label="Profile"
          />

        </nav>

        {/* User */}

        <div className="border-t border-white/10 p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <FaUserCircle />
            </div>

            <div>

              <p className="font-medium">
                Demo User
              </p>

              <p className="text-xs text-slate-400">
                demo@smartbank.com
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="flex-1 min-w-0">

        {/* Header */}

        <header className="h-20 bg-white border-b flex items-center justify-between px-5 lg:px-8">

          <div className="flex items-center gap-4">

            <button
              className="lg:hidden text-slate-700 text-xl"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <div>

              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
                Good Morning, Demo User 👋
              </h2>

              <p className="text-sm text-slate-500">
                Here's your financial overview.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-5">

            <button className="relative text-slate-600 text-xl">

              <FaBell />

              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />

            </button>

            <div className="hidden sm:flex items-center gap-2">

              <FaUserCircle className="text-3xl text-blue-600" />

              <span className="font-medium">
                Demo User
              </span>

            </div>

          </div>

        </header>

        {/* Content */}

        <div className="p-5 lg:p-8">

          {/* ================= BALANCE ================= */}

          <div className="grid lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-3xl p-7 shadow-lg">

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-blue-200">
                    Total Balance
                  </p>

                  <h1 className="text-4xl lg:text-5xl font-bold mt-2">
                    ₹1,24,850.00
                  </h1>

                </div>

                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <FaWallet />
                </div>

              </div>

              <div className="mt-8 flex flex-wrap gap-8">

                <div>

                  <p className="text-blue-200 text-sm">
                    Account Number
                  </p>

                  <p className="font-medium mt-1">
                    XXXX XXXX 4582
                  </p>

                </div>

                <div>

                  <p className="text-blue-200 text-sm">
                    Account Type
                  </p>

                  <p className="font-medium mt-1">
                    Savings Account
                  </p>

                </div>

              </div>

            </div>

            {/* AI Insight */}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FaRobot />
                </div>

                <div>

                  <h3 className="font-bold">
                    AI Insight
                  </h3>

                  <p className="text-xs text-slate-500">
                    Smart Financial Assistant
                  </p>

                </div>

              </div>

              <p className="text-slate-600 mt-5 leading-6 text-sm">

                Your shopping expenses are slightly higher
                this month. Consider reducing discretionary
                purchases to improve your savings.

              </p>

              <button className="text-blue-600 font-medium text-sm mt-4">
                View AI Advisor →
              </button>

            </div>

          </div>

          {/* ================= STAT CARDS ================= */}

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

          {/* ================= CHART + TRANSACTIONS ================= */}

          <div className="grid xl:grid-cols-3 gap-6 mt-6">

            {/* Chart */}

            <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">

              <div className="flex justify-between items-center">

                <div>

                  <h3 className="text-lg font-bold">
                    Spending Overview
                  </h3>

                  <p className="text-sm text-slate-500">
                    Your monthly spending pattern
                  </p>

                </div>

                <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option>2026</option>
                  <option>2025</option>
                </select>

              </div>

              {/* Simple chart visualization */}

              <div className="h-64 mt-8 flex items-end gap-3 sm:gap-5">

                {[40, 55, 35, 70, 48, 65, 52, 80, 60, 75, 45, 68].map(
                  (height, index) => (

                    <div
                      key={index}
                      className="flex-1 flex flex-col justify-end h-full"
                    >

                      <div
                        className="bg-blue-500 hover:bg-blue-600 rounded-t-lg transition"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                      <span className="text-xs text-slate-400 text-center mt-2">
                        {index + 1}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* Quick Actions */}

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">

              <h3 className="text-lg font-bold">
                Quick Actions
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Manage your finances quickly
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">

                <QuickAction
                  icon={<FaArrowUp />}
                  label="Transfer"
                />

                <QuickAction
                  icon={<FaCreditCard />}
                  label="Cards"
                />

                <QuickAction
                  icon={<FaReceipt />}
                  label="Scan Receipt"
                />

                <QuickAction
                  icon={<FaChartLine />}
                  label="Analytics"
                />

              </div>

            </div>

          </div>

          {/* ================= TRANSACTIONS ================= */}

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mt-6">

            <div className="flex justify-between items-center">

              <div>

                <h3 className="text-lg font-bold">
                  Recent Transactions
                </h3>

                <p className="text-sm text-slate-500">
                  Your latest account activity
                </p>

              </div>

              <button className="text-blue-600 font-medium text-sm">
                View All
              </button>

            </div>

            <div className="mt-5 divide-y">

              {transactions.map((transaction, index) => (

                <div
                  key={index}
                  className="py-4 flex items-center justify-between gap-4"
                >

                  <div className="flex items-center gap-4">

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >

                      {transaction.type === "income"
                        ? <FaArrowDown />
                        : <FaArrowUp />
                      }

                    </div>

                    <div>

                      <p className="font-medium text-slate-800">
                        {transaction.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {transaction.category} • {transaction.date}
                      </p>

                    </div>

                  </div>

                  <p
                    className={`font-semibold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-slate-800"
                    }`}
                  >
                    {transaction.amount}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}


/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({ icon, label, active }) {
  return (
    <button
      className={`
        w-full
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-xl
        text-sm
        transition
        ${
          active
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  amount,
  change,
  positive,
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {amount}
          </h3>

        </div>

        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>

      </div>

      <p
        className={`text-xs mt-4 ${
          positive
            ? "text-green-600"
            : "text-orange-500"
        }`}
      >
        {change} from last month
      </p>

    </div>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({ icon, label }) {
  return (
    <button className="border border-slate-100 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50 transition">

      <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">

        {icon}

      </div>

      <p className="text-sm font-medium mt-3">
        {label}
      </p>

    </button>
  );
}