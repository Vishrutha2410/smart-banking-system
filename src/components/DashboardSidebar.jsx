import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaWallet,
  FaExchangeAlt,
  FaArrowUp,
  FaCreditCard,
  FaPiggyBank,
  FaChartBar,
  FaCalculator,
  FaRobot,
  FaComments,
  FaReceipt,
  FaShieldAlt,
  FaFileAlt,
  FaCog,
  FaUserShield,
} from "react-icons/fa";

const mainMenu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FaChartLine />,
  },
  {
    name: "Accounts",
    path: "/accounts",
    icon: <FaWallet />,
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: <FaExchangeAlt />,
  },
  {
    name: "Transfer Money",
    path: "/transfer",
    icon: <FaArrowUp />,
  },
  {
    name: "Cards",
    path: "/cards",
    icon: <FaCreditCard />,
  },
  {
    name: "Loans",
    path: "/loans",
    icon: <FaPiggyBank />,
  },
  {
    name: "Analytics",
    path: "/reports",
    icon: <FaChartBar />,
  },
  {
    name: "Budget",
    path: "/financial-advisor",
    icon: <FaCalculator />,
  },
];

const aiMenu = [
  {
    name: "AI Financial Advisor",
    path: "/financial-advisor",
    icon: <FaRobot />,
  },
  {
    name: "AI Chatbot",
    path: "/chatbot",
    icon: <FaComments />,
  },
  {
    name: "Receipt Scanner",
    path: "/receipt-scanner",
    icon: <FaReceipt />,
  },
  {
    name: "Fraud Detection",
    path: "/fraud-detection",
    icon: <FaShieldAlt />,
  },
];

const otherMenu = [
  {
    name: "Reports",
    path: "/reports",
    icon: <FaFileAlt />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FaCog />,
  },
];

export default function DashboardSidebar() {
  return (
    <aside className="w-[335px] bg-[#020617] text-white min-h-screen flex flex-col">

      {/* Logo */}

      <div className="px-7 py-6 border-b border-slate-800">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl">
            <FaWallet />
          </div>

          <div>

            <h1 className="text-xl font-bold">
              SmartBank AI
            </h1>

            <p className="text-sm text-blue-300">
              Intelligent Banking
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto px-5 py-6">

        {/* Main */}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">
          Main
        </p>

        <nav className="space-y-2">

          {mainMenu.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
            />
          ))}

        </nav>

        {/* AI Services */}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mt-8 mb-3">
          AI Services
        </p>

        <nav className="space-y-2">

          {aiMenu.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
            />
          ))}

        </nav>

        {/* Other */}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mt-8 mb-3">
          Other
        </p>

        <nav className="space-y-2">

          {otherMenu.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
            />
          ))}

        </nav>

        {/* Admin */}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mt-8 mb-3">
          Administration
        </p>

        <SidebarItem
          item={{
            name: "Admin Dashboard",
            path: "/admin",
            icon: <FaUserShield />,
          }}
        />

      </div>

      {/* User */}

      <div className="border-t border-slate-800 p-5">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center">
            <FaUserShield />
          </div>

          <div className="min-w-0">

            <p className="font-semibold truncate">
              Demo User
            </p>

            <p className="text-sm text-slate-400 truncate">
              demo@smartbank.com
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}


/* Sidebar Item */

function SidebarItem({ item }) {

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `
        flex items-center gap-4
        px-4 py-3.5
        rounded-xl
        transition-all duration-200
        text-sm font-medium
        ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }
        `
      }
    >

      <span className="text-lg">
        {item.icon}
      </span>

      <span>
        {item.name}
      </span>

    </NavLink>
  );
}