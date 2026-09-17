import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiHome,
  FiCreditCard,
  FiList,
  FiSend,
  FiMenu,
  FiX,
  FiLogOut,
  FiBell,
  FiPieChart,
  FiTrendingUp,
  FiCpu,
  FiMessageCircle,
  FiCamera,
  FiShield,
  FiFileText,
  FiUser,
  FiSettings,
  FiGrid,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/accounts", label: "Accounts", icon: FiCreditCard },
  { to: "/transactions", label: "Transactions", icon: FiList },
  { to: "/transfers", label: "Fund Transfer", icon: FiSend },
  { to: "/cards", label: "Cards", icon: FiCreditCard },
  { to: "/loans", label: "Loans", icon: FiFileText },
  { to: "/budget", label: "Budget", icon: FiPieChart },
  { to: "/analytics", label: "Analytics", icon: FiTrendingUp },
  { to: "/financial-advisor", label: "AI Financial Advisor", icon: FiCpu },
  { to: "/chatbot", label: "AI Chatbot", icon: FiMessageCircle },
  { to: "/receipt-scanner", label: "Receipt Scanner", icon: FiCamera },
  { to: "/fraud-detection", label: "Fraud Detection", icon: FiShield },
  { to: "/reports", label: "Reports", icon: FiFileText },
  { to: "/notifications", label: "Notifications", icon: FiBell },
  { to: "/profile", label: "Profile", icon: FiUser },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
      isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  const renderNav = (onClick) => (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onClick}>
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.to === "/notifications" && unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink to="/admin" className={linkClasses} onClick={onClick}>
          <FiGrid className="h-4 w-4 shrink-0" />
          Admin Dashboard
        </NavLink>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="mb-6 px-2 text-xl font-bold text-brand-700">SmartBank</div>
        {renderNav()}
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <FiLogOut className="h-4 w-4" /> Logout
        </button>
      </aside>

      {/* Sidebar - mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-72 flex-col bg-white px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-xl font-bold text-brand-700">SmartBank</span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {renderNav(() => setSidebarOpen(false))}
            <button
              onClick={logout}
              className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <FiLogOut className="h-4 w-4" /> Logout
            </button>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <button
            className="text-slate-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <div className="hidden text-sm text-slate-500 md:block">
            Welcome back, <span className="font-medium text-slate-800">{user?.name}</span>
            {isAdmin && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/notifications" aria-label="Notifications" className="relative text-slate-500 hover:text-slate-700">
              <FiBell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" className="flex items-center gap-2">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden text-sm leading-tight sm:block">
                <p className="font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
