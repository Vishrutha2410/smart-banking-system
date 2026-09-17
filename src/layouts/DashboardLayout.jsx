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
    `sb-nav-link ${isActive ? "active" : ""}`;

  const renderNav = (onClick) => (
    <nav className="sb-sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Banking
      </p>

      {navItems.slice(0, 8).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={linkClasses}
          onClick={onClick}
        >
          <item.icon className="h-[17px] w-[17px] shrink-0" />
          <span className="flex-1">{item.label}</span>

          {item.to === "/notifications" && unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}

      <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Smart tools
      </p>

      {navItems.slice(8, 13).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={linkClasses}
          onClick={onClick}
        >
          <item.icon className="h-[17px] w-[17px] shrink-0" />
          <span className="flex-1">{item.label}</span>

          {item.to === "/notifications" && unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}

      <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Account
      </p>

      {navItems.slice(13).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={linkClasses}
          onClick={onClick}
        >
          <item.icon className="h-[17px] w-[17px] shrink-0" />
          <span className="flex-1">{item.label}</span>

          {item.to === "/notifications" && unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}

      {isAdmin && (
        <>
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Administration
          </p>

          <NavLink
            to="/admin"
            className={linkClasses}
            onClick={onClick}
          >
            <FiGrid className="h-[17px] w-[17px] shrink-0" />
            Admin Dashboard
          </NavLink>
        </>
      )}
    </nav>
  );

  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - desktop */}
      <aside className="sb-sidebar hidden w-[270px] flex-col px-4 py-5 md:flex">
        <div className="sb-brand">
          <div className="sb-brand-mark">S</div>

          <div>
            <div className="sb-brand-name">SmartBank</div>
            <div className="sb-brand-subtitle">Digital banking</div>
          </div>
        </div>

        {renderNav()}

        <div className="sb-user-panel">
          <div className="mb-3 flex items-center gap-3">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {userInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="sb-logout flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold transition hover:bg-red-50"
          >
            <FiLogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar - mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="sb-sidebar flex w-[285px] flex-col px-4 py-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="sb-brand mb-0 p-0">
                <div className="sb-brand-mark">S</div>

                <div>
                  <div className="sb-brand-name">SmartBank</div>
                  <div className="sb-brand-subtitle">Digital banking</div>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {renderNav(() => setSidebarOpen(false))}

            <button
              onClick={logout}
              className="sb-logout mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-red-50"
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          <div
            className="flex-1 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sb-topbar flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu className="h-6 w-6" />
            </button>

            <div className="hidden min-w-0 md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                SmartBank workspace
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                Welcome back, {user?.name || "User"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {isAdmin && (
              <span className="hidden rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 sm:inline-flex">
                Admin
              </span>
            )}

            <NavLink
              to="/notifications"
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <FiBell className="h-[18px] w-[18px]" />

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profile" className="flex items-center gap-2.5">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 ring-2 ring-white">
                  {userInitial}
                </div>
              )}

              <div className="hidden text-sm leading-tight sm:block">
                <p className="max-w-32 truncate font-semibold text-slate-800">
                  {user?.name}
                </p>
                <p className="max-w-32 truncate text-[11px] text-slate-400">
                  {user?.email}
                </p>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="sb-page-area flex-1 overflow-y-auto p-4 md:p-7 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;