import { useState } from "react";

import {
  NavLink,
  Outlet,
} from "react-router-dom";

import {
  FiMenu,
  FiX,
  FiLogOut,
  FiGrid,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import { useNotifications } from "../context/NotificationContext";

import {
  getCustomerTypeConfig,
  getCommonAccountItems,
} from "../config/customerTypeConfig";

const DashboardLayout = () => {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const {
    user,
    logout,
    isAdmin,
  } = useAuth();

  const {
    unreadCount,
  } =
    useNotifications();

  const customerType =
    user?.customerType ||
    "personal";

  const config =
    getCustomerTypeConfig(
      customerType
    );

  const commonItems =
    getCommonAccountItems();

  const customerItems =
    config.items;

  const renderNav = (
    onClick
  ) => (
    <nav className="sb-sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
      {/* =================================================
          CUSTOMER BANKING
      ================================================== */}

      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {config.label}
      </p>

      {customerItems.map(
        (item) => {
          const Icon =
            item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({
                isActive,
              }) =>
                `sb-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              onClick={
                onClick
              }
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />

              <span className="flex-1">
                {item.label}
              </span>

              {item.to ===
                "/notifications" &&
                unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {
                      unreadCount
                    }
                  </span>
                )}
            </NavLink>
          );
        }
      )}

      {/* =================================================
          ACCOUNT
      ================================================== */}

      <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Account
      </p>

      {commonItems.map(
        (item) => {
          const Icon =
            item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({
                isActive,
              }) =>
                `sb-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              onClick={
                onClick
              }
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />

              <span className="flex-1">
                {item.label}
              </span>

              {item.to ===
                "/notifications" &&
                unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {
                      unreadCount
                    }
                  </span>
                )}
            </NavLink>
          );
        }
      )}

      {/* =================================================
          ADMINISTRATION
      ================================================== */}

      {isAdmin && (
        <>
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Administration
          </p>

          <NavLink
            to="/admin"
            className={({
              isActive,
            }) =>
              `sb-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
            onClick={
              onClick
            }
          >
            <FiGrid className="h-[17px] w-[17px] shrink-0" />

            Admin Dashboard
          </NavLink>
        </>
      )}
    </nav>
  );

  const userInitial =
    user?.name
      ?.charAt(0)
      .toUpperCase() ||
    "U";

  return (
    <div className="flex h-screen bg-slate-50">
      {/* =================================================
          DESKTOP SIDEBAR
      ================================================== */}

      <aside className="sb-sidebar hidden w-[270px] flex-col px-4 py-5 md:flex">
        <div className="sb-brand">
          <div className="sb-brand-mark">
            S
          </div>

          <div>
            <div className="sb-brand-name">
              SmartBank
            </div>

            <div className="sb-brand-subtitle">
              {config.label}
            </div>
          </div>
        </div>

        {renderNav()}

        <div className="sb-user-panel">
          <div className="mb-3 flex items-center gap-3">
            {user?.profileImage ? (
              <img
                src={
                  user.profileImage
                }
                alt={
                  user.name
                }
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {
                  userInitial
                }
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name ||
                  "User"}
              </p>

              <p className="truncate text-[10px] text-slate-500">
                {user?.email ||
                  ""}
              </p>
            </div>
          </div>

          <button
            onClick={
              logout
            }
            className="sb-logout flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold transition hover:bg-red-50"
          >
            <FiLogOut className="h-4 w-4" />

            Logout
          </button>
        </div>
      </aside>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================== */}

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="sb-sidebar flex w-[285px] flex-col px-4 py-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="sb-brand mb-0 p-0">
                <div className="sb-brand-mark">
                  S
                </div>

                <div>
                  <div className="sb-brand-name">
                    SmartBank
                  </div>

                  <div className="sb-brand-subtitle">
                    {config.label}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {renderNav(() =>
              setSidebarOpen(
                false
              )
            )}

            <div className="sb-user-panel">
              <div className="mb-3 flex items-center gap-3">
                {user?.profileImage ? (
                  <img
                    src={
                      user.profileImage
                    }
                    alt={
                      user.name
                    }
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                    {
                      userInitial
                    }
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {user?.name ||
                      "User"}
                  </p>

                  <p className="truncate text-[10px] text-slate-500">
                    {user?.email ||
                      ""}
                  </p>
                </div>
              </div>

              <button
                onClick={
                  logout
                }
                className="sb-logout flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold transition hover:bg-red-50"
              >
                <FiLogOut className="h-4 w-4" />

                Logout
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
            className="flex-1 bg-black/40"
          />
        </div>
      )}

      {/* =================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            onClick={() =>
              setSidebarOpen(
                true
              )
            }
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <FiMenu className="h-6 w-6" />
          </button>

          <div className="ml-3">
            <div className="text-sm font-bold text-slate-900">
              SmartBank
            </div>

            <div className="text-[10px] text-slate-500">
              {config.label}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;