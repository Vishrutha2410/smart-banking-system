import { useEffect, useState } from "react";
import { FiUsers, FiCreditCard, FiSend, FiFileText, FiShield, FiSearch } from "react-icons/fi";
import {
  getAdminStats,
  getAdminUsers,
  setUserStatus,
  getAdminAccounts,
  getAdminTransactions,
  getAdminTransfers,
  getAdminLoans,
  setLoanStatus,
  getAdminFraudAlerts,
} from "../services/adminService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const TABS = ["Overview", "Users", "Accounts", "Transactions", "Transfers", "Loans", "Fraud"];

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      {Icon && <Icon className="h-4 w-4 text-slate-300" />}
    </div>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("loading");

  const loadTab = async (tab) => {
    setStatus("loading");
    try {
      switch (tab) {
        case "Overview":
          setStats(await getAdminStats());
          break;
        case "Users":
          setUsers(await getAdminUsers());
          break;
        case "Accounts":
          setAccounts(await getAdminAccounts());
          break;
        case "Transactions":
          setTransactions((await getAdminTransactions()).transactions);
          break;
        case "Transfers":
          setTransfers(await getAdminTransfers());
          break;
        case "Loans":
          setLoans(await getAdminLoans());
          break;
        case "Fraud":
          setFraudAlerts(await getAdminFraudAlerts());
          break;
        default:
          break;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    loadTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      setUsers(await getAdminUsers({ search }));
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const updated = await setUserStatus(user._id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (err) {
      // no-op
    }
  };

  const handleLoanStatus = async (loan, newStatus) => {
    try {
      const updated = await setLoanStatus(loan._id, newStatus);
      setLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
    } catch (err) {
      // no-op
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Platform-wide oversight and management.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {status === "loading" && <Loader />}
      {status === "error" && <ErrorState onRetry={() => loadTab(activeTab)} />}

      {status === "success" && activeTab === "Overview" && stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={FiUsers} />
          <StatCard label="Active Users" value={stats.activeUsers} icon={FiUsers} />
          <StatCard label="Total Accounts" value={stats.totalAccounts} icon={FiCreditCard} />
          <StatCard
            label="Total Deposits"
            value={`₹${stats.totalDeposits.toLocaleString("en-IN")}`}
          />
          <StatCard label="Total Transactions" value={stats.totalTransactions} icon={FiFileText} />
          <StatCard label="Total Transfers" value={stats.totalTransfers} icon={FiSend} />
          <StatCard label="Total Loans" value={stats.totalLoans} />
          <StatCard label="Pending Loans" value={stats.pendingLoans} />
          <StatCard label="Fraud Alerts" value={stats.fraudAlerts} icon={FiShield} />
        </div>
      )}

      {status === "success" && activeTab === "Users" && (
        <div className="space-y-4">
          <form onSubmit={handleUserSearch} className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          {users.length === 0 ? (
            <EmptyState title="No users found" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="px-4 py-3 text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3 text-slate-500">{u.phone || "—"}</td>
                      <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {status === "success" && activeTab === "Accounts" && (
        accounts.length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Account #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a._id}>
                    <td className="px-4 py-3 text-slate-800">{a.user?.name || "Unknown"}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{a.accountNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{a.accountType}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{a.balance.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {status === "success" && activeTab === "Transactions" && (
        transactions.length === 0 ? (
          <EmptyState title="No transactions found" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 text-slate-800">{t.user?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500">{t.type}</td>
                    <td className="px-4 py-3 text-slate-500">{t.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {status === "success" && activeTab === "Transfers" && (
        transfers.length === 0 ? (
          <EmptyState title="No transfers found" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 text-slate-800">{t.sender?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-800">{t.recipient?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.referenceNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {status === "success" && activeTab === "Loans" && (
        loans.length === 0 ? (
          <EmptyState title="No loan applications yet" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l._id}>
                    <td className="px-4 py-3 text-slate-800">{l.user?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-500">{l.loanType}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{l.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{l.status}</td>
                    <td className="px-4 py-3">
                      {l.status === "Pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoanStatus(l, "Approved")}
                            className="text-xs font-medium text-emerald-600 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLoanStatus(l, "Rejected")}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {status === "success" && activeTab === "Fraud" && (
        fraudAlerts.length === 0 ? (
          <EmptyState title="No fraud alerts." />
        ) : (
          <ul className="space-y-2">
            {fraudAlerts.map((a) => (
              <li key={a._id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{a.user?.name || "Unknown user"}</p>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    {a.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{a.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default AdminDashboard;
