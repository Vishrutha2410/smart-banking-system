import { useEffect, useState } from "react";

import {
  FiUsers,
  FiCreditCard,
  FiSend,
  FiFileText,
  FiShield,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiHash,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiDollarSign,
  FiLock,
  FiHome,
  FiFilter,
  FiX,
} from "react-icons/fi";

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

const TABS = [
  "Overview",
  "Users",
  "Accounts",
  "Transactions",
  "Transfers",
  "Loans",
  "Fraud",
];

// ======================================================
// STAT CARD
// ======================================================

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>

      {Icon && (
        <Icon className="h-4 w-4 text-slate-300" />
      )}
    </div>

    <p className="mt-2 text-2xl font-bold text-slate-900">
      {value}
    </p>
  </div>
);

// ======================================================
// DETAIL ITEM
// ======================================================

const DetailItem = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
    <div className="flex items-center gap-2">
      {Icon && (
        <Icon className="h-4 w-4 text-slate-400" />
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>

    <p className="mt-1 break-words text-sm font-medium text-slate-800">
      {value || "Not provided"}
    </p>
  </div>
);

// ======================================================
// ACCOUNT TYPE BADGE
// ======================================================

const AccountTypeBadge = ({ type }) => {
  const styles = {
    Savings: "bg-blue-50 text-blue-700",
    Current: "bg-purple-50 text-purple-700",
    Salary: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[type] || "bg-slate-100 text-slate-600"
      }`}
    >
      {type || "Unknown"}
    </span>
  );
};

// ======================================================
// ACCOUNT STATUS BADGE
// ======================================================

const AccountStatusBadge = ({ status }) => {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  const active =
    normalizedStatus === "active" ||
    normalizedStatus === "completed" ||
    normalizedStatus === "success" ||
    normalizedStatus === "successful";

  const blocked =
    normalizedStatus === "blocked" ||
    normalizedStatus === "failed" ||
    normalizedStatus === "rejected";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : blocked
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "unknown"}
    </span>
  );
};

// ======================================================
// TRANSFER STATUS BADGE
// ======================================================

const TransferStatusBadge = ({ status }) => {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  let className =
    "bg-slate-100 text-slate-600";

  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "success" ||
    normalizedStatus === "successful"
  ) {
    className =
      "bg-emerald-50 text-emerald-700";
  } else if (
    normalizedStatus === "pending" ||
    normalizedStatus === "processing"
  ) {
    className =
      "bg-amber-50 text-amber-700";
  } else if (
    normalizedStatus === "failed" ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    className =
      "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
};

// ======================================================
// DATE HELPERS
// ======================================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ======================================================
// AMOUNT FORMATTER
// ======================================================

const formatAmount = (value) => {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;
};

// ======================================================
// TRANSACTION TYPE STYLE
// ======================================================

const getTransactionTypeClass = (type) => {
  const normalized = String(
    type || ""
  ).toLowerCase();

  if (
    normalized === "income" ||
    normalized === "deposit"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "expense" ||
    normalized === "withdrawal"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (normalized === "transfer") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
};

// ======================================================
// TRANSACTION ICON
// ======================================================

const getTransactionIcon = (type) => {
  const normalized = String(
    type || ""
  ).toLowerCase();

  if (
    normalized === "income" ||
    normalized === "deposit"
  ) {
    return FiArrowDownCircle;
  }

  if (
    normalized === "expense" ||
    normalized === "withdrawal"
  ) {
    return FiArrowUpCircle;
  }

  if (normalized === "transfer") {
    return FiRepeat;
  }

  return FiFileText;
};

// ======================================================
// TRANSFER HELPERS
// ======================================================

const getTransferSender = (transfer) => {
  return (
    transfer.sender ||
    transfer.fromUser ||
    transfer.from ||
    null
  );
};

const getTransferReceiver = (transfer) => {
  return (
    transfer.recipient ||
    transfer.receiver ||
    transfer.toUser ||
    transfer.to ||
    null
  );
};

const getTransferFromAccount = (transfer) => {
  return (
    transfer.senderAccount ||
    transfer.fromAccount ||
    transfer.sourceAccount ||
    transfer.debitAccount ||
    transfer.account ||
    null
  );
};

const getTransferToAccount = (transfer) => {
  return (
    transfer.recipientAccount ||
    transfer.receiverAccount ||
    transfer.toAccount ||
    transfer.destinationAccount ||
    transfer.creditAccount ||
    null
  );
};

const getAccountNumber = (account) => {
  if (!account) return "";

  if (typeof account === "string") {
    return account;
  }

  return (
    account.accountNumber ||
    account.number ||
    account.accountNo ||
    ""
  );
};

const getAccountType = (account) => {
  if (!account || typeof account !== "object") {
    return "";
  }

  return (
    account.accountType ||
    account.type ||
    ""
  );
};

const getPersonName = (person) => {
  if (!person) return "";

  if (typeof person === "string") {
    return person;
  }

  return (
    person.name ||
    person.fullName ||
    person.username ||
    person.email ||
    ""
  );
};

const getTransferDate = (transfer) => {
  return (
    transfer.transferDate ||
    transfer.date ||
    transfer.createdAt ||
    transfer.updatedAt ||
    null
  );
};

const getTransferReference = (transfer) => {
  return (
    transfer.referenceNumber ||
    transfer.referenceId ||
    transfer.reference ||
    transfer.transactionReference ||
    transfer.transferReference ||
    transfer._id ||
    ""
  );
};

const getTransferStatus = (transfer) => {
  return (
    transfer.status ||
    transfer.transferStatus ||
    "Unknown"
  );
};

// ======================================================
// ADMIN DASHBOARD
// ======================================================

const AdminDashboard = () => {
  // ====================================================
  // MAIN STATE
  // ====================================================

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [stats, setStats] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [accountGroups, setAccountGroups] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [transfers, setTransfers] =
    useState([]);

  const [loans, setLoans] =
    useState([]);

  const [fraudAlerts, setFraudAlerts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("loading");

  // ====================================================
  // TRANSACTION EXPANSION STATE
  // ====================================================

  const [
    expandedTransactionUsers,
    setExpandedTransactionUsers,
  ] = useState({});

  const [
    expandedTransactionAccounts,
    setExpandedTransactionAccounts,
  ] = useState({});

  const [
    expandedTransactions,
    setExpandedTransactions,
  ] = useState({});

  const [
    transactionSearch,
    setTransactionSearch,
  ] = useState("");

  // ====================================================
  // TRANSFER FILTER STATE
  // ====================================================

  const [
    transferSearch,
    setTransferSearch,
  ] = useState("");

  const [
    transferStatusFilter,
    setTransferStatusFilter,
  ] = useState("all");

  const [
    transferDateFrom,
    setTransferDateFrom,
  ] = useState("");

  const [
    transferDateTo,
    setTransferDateTo,
  ] = useState("");

  // ====================================================
  // LOAD TAB
  // ====================================================

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
          setAccountGroups(
            await getAdminAccounts()
          );

          setSelectedUser(null);
          setSelectedAccount(null);
          break;

        case "Transactions": {
          const response =
            await getAdminTransactions();

          setTransactions(
            response?.transactions || []
          );

          break;
        }

        case "Transfers":
          setTransfers(
            await getAdminTransfers()
          );
          break;

        case "Loans":
          setLoans(
            await getAdminLoans()
          );
          break;

        case "Fraud":
          setFraudAlerts(
            await getAdminFraudAlerts()
          );
          break;

        default:
          break;
      }

      setStatus("success");
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    loadTab(activeTab);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ====================================================
  // USER SEARCH
  // ====================================================

  const handleUserSearch = async (e) => {
    e.preventDefault();

    setStatus("loading");

    try {
      setUsers(
        await getAdminUsers({
          search,
        })
      );

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  // ====================================================
  // TOGGLE USER STATUS
  // ====================================================

  const toggleUserStatus = async (user) => {
    try {
      const updated =
        await setUserStatus(
          user._id,
          !user.isActive
        );

      setUsers((prev) =>
        prev.map((u) =>
          u._id === updated._id
            ? updated
            : u
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ====================================================
  // LOAN STATUS
  // ====================================================

  const handleLoanStatus = async (
    loan,
    newStatus
  ) => {
    try {
      const updated =
        await setLoanStatus(
          loan._id,
          newStatus
        );

      setLoans((prev) =>
        prev.map((l) =>
          l._id === updated._id
            ? updated
            : l
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ====================================================
  // ACCOUNT DETAILS
  // ====================================================

  const openUserDetails = (group) => {
    setSelectedUser(group);
    setSelectedAccount(null);
  };

  const openAccountDetails = (account) => {
    setSelectedAccount(account);
  };

  const backToAccountUsers = () => {
    setSelectedUser(null);
    setSelectedAccount(null);
  };

  const backToUserDetails = () => {
    setSelectedAccount(null);
  };

  // ====================================================
  // GROUP TRANSACTIONS
  //
  // Structure:
  //
  // User
  //   -> Account
  //       -> Transactions
  // ====================================================

  const transactionGroups = (() => {
    const groups = new Map();

    transactions.forEach((transaction) => {
      const user =
        transaction.user || null;

      const account =
        transaction.account || null;

      const userId =
        user?._id ||
        user?.id ||
        account?.user ||
        transaction.userId ||
        `unknown-user-${transaction._id}`;

      const userKey = String(userId);

      if (!groups.has(userKey)) {
        groups.set(userKey, {
          key: userKey,
          user,
          accounts: new Map(),
        });
      }

      const group = groups.get(userKey);

      const accountId =
        account?._id ||
        account?.id ||
        transaction.accountId ||
        transaction.accountNumber ||
        `unknown-account-${transaction._id}`;

      const accountKey =
        String(accountId);

      if (
        !group.accounts.has(accountKey)
      ) {
        group.accounts.set(
          accountKey,
          {
            key: accountKey,
            account,
            transactions: [],
          }
        );
      }

      group.accounts
        .get(accountKey)
        .transactions.push(transaction);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,

        accounts:
          Array.from(
            group.accounts.values()
          ).sort((a, b) => {
            const aNumber =
              a.account?.accountNumber ||
              a.transactions[0]
                ?.accountNumber ||
              "";

            const bNumber =
              b.account?.accountNumber ||
              b.transactions[0]
                ?.accountNumber ||
              "";

            return String(
              aNumber
            ).localeCompare(
              String(bNumber)
            );
          }),
      }))

      .filter((group) => {
        const searchValue =
          transactionSearch
            .trim()
            .toLowerCase();

        if (!searchValue) {
          return true;
        }

        const user =
          group.user || {};

        const userMatches = [
          user.name,
          user.email,
          user.phone,
          user.address,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchValue)
        );

        const accountMatches =
          group.accounts.some(
            (accountGroup) => {
              const account =
                accountGroup.account ||
                {};

              const accountFields = [
                account.accountNumber,
                account.accountType,
                account.ifsc,
                account.upiId,
                account.fullName,
                account.email,
                account.mobileNumber,
                ...accountGroup.transactions.flatMap(
                  (transaction) => [
                    transaction.type,
                    transaction.category,
                    transaction.description,
                    transaction.receiverName,
                    transaction.receiverAccount,
                    transaction.status,
                    transaction.referenceNumber,
                    transaction.accountNumber,
                  ]
                ),
              ];

              return accountFields.some(
                (value) =>
                  String(value || "")
                    .toLowerCase()
                    .includes(
                      searchValue
                    )
              );
            }
          );

        return (
          userMatches ||
          accountMatches
        );
      });
  })();

  // ====================================================
  // TRANSACTION TOGGLES
  // ====================================================

  const toggleTransactionUser = (
    userKey
  ) => {
    setExpandedTransactionUsers(
      (previous) => ({
        ...previous,
        [userKey]:
          !previous[userKey],
      })
    );
  };

  const toggleTransactionAccount = (
    accountKey
  ) => {
    setExpandedTransactionAccounts(
      (previous) => ({
        ...previous,
        [accountKey]:
          !previous[accountKey],
      })
    );
  };

  const toggleTransaction = (
    transactionId
  ) => {
    setExpandedTransactions(
      (previous) => ({
        ...previous,
        [transactionId]:
          !previous[
            transactionId
          ],
      })
    );
  };

  // ====================================================
  // TRANSFER FILTERING
  // ====================================================

  const filteredTransfers =
    transfers.filter((transfer) => {
      const sender =
        getTransferSender(transfer);

      const receiver =
        getTransferReceiver(transfer);

      const fromAccount =
        getTransferFromAccount(
          transfer
        );

      const toAccount =
        getTransferToAccount(
          transfer
        );

      const senderName =
        getPersonName(sender);

      const receiverName =
        getPersonName(receiver);

      const fromAccountNumber =
        getAccountNumber(
          fromAccount
        );

      const toAccountNumber =
        getAccountNumber(
          toAccount
        );

      const reference =
        getTransferReference(
          transfer
        );

      const transferStatus =
        getTransferStatus(
          transfer
        );

      const transferDate =
        getTransferDate(transfer);

      // ----------------------------------------------
      // SEARCH
      // ----------------------------------------------

      const searchValue =
        transferSearch
          .trim()
          .toLowerCase();

      const searchableText = [
        senderName,
        sender?.email,
        sender?.phone,
        receiverName,
        receiver?.email,
        receiver?.phone,
        fromAccountNumber,
        toAccountNumber,
        reference,
        transferStatus,
        transfer.amount,
        transfer._id,
      ]
        .map((value) =>
          String(value ?? "")
            .toLowerCase()
        )
        .join(" ");

      if (
        searchValue &&
        !searchableText.includes(
          searchValue
        )
      ) {
        return false;
      }

      // ----------------------------------------------
      // STATUS FILTER
      // ----------------------------------------------

      if (
        transferStatusFilter !==
          "all" &&
        String(
          transferStatus
        ).toLowerCase() !==
          transferStatusFilter.toLowerCase()
      ) {
        return false;
      }

      // ----------------------------------------------
      // DATE FROM
      // ----------------------------------------------

      if (transferDateFrom) {
        const selectedFromDate =
          new Date(
            `${transferDateFrom}T00:00:00`
          );

        const actualDate =
          new Date(
            transferDate
          );

        if (
          Number.isNaN(
            actualDate.getTime()
          ) ||
          actualDate < selectedFromDate
        ) {
          return false;
        }
      }

      // ----------------------------------------------
      // DATE TO
      // ----------------------------------------------

      if (transferDateTo) {
        const selectedToDate =
          new Date(
            `${transferDateTo}T23:59:59`
          );

        const actualDate =
          new Date(
            transferDate
          );

        if (
          Number.isNaN(
            actualDate.getTime()
          ) ||
          actualDate > selectedToDate
        ) {
          return false;
        }
      }

      return true;
    });

  // ====================================================
  // TRANSFER FILTER VALUES
  // ====================================================

  const transferStatuses = [
    ...new Set(
      transfers
        .map((transfer) =>
          getTransferStatus(
            transfer
          )
        )
        .filter(Boolean)
        .map((value) =>
          String(value)
        )
    ),
  ];

  // ====================================================
  // RESET TRANSFER FILTERS
  // ====================================================

  const resetTransferFilters = () => {
    setTransferSearch("");
    setTransferStatusFilter("all");
    setTransferFromTypeFilter("all");
    setTransferDateFrom("");
    setTransferDateTo("");
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-6">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Platform-wide oversight and management.
        </p>
      </div>

      {/* ==================================================
          TABS
      ================================================== */}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedUser(null);
              setSelectedAccount(null);
            }}
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

      {/* ==================================================
          LOADING
      ================================================== */}

      {status === "loading" && (
        <Loader />
      )}

      {/* ==================================================
          ERROR
      ================================================== */}

      {status === "error" && (
        <ErrorState
          onRetry={() =>
            loadTab(activeTab)
          }
        />
      )}

      {/* ==================================================
          OVERVIEW
      ================================================== */}

      {status === "success" &&
        activeTab === "Overview" &&
        stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={FiUsers}
            />

            <StatCard
              label="Active Users"
              value={stats.activeUsers}
              icon={FiUsers}
            />

            <StatCard
              label="Total Accounts"
              value={stats.totalAccounts}
              icon={FiCreditCard}
            />

            <StatCard
              label="Total Deposits"
              value={`₹${Number(
                stats.totalDeposits || 0
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            <StatCard
              label="Total Transactions"
              value={
                stats.totalTransactions
              }
              icon={FiFileText}
            />

            <StatCard
              label="Total Transfers"
              value={
                stats.totalTransfers
              }
              icon={FiSend}
            />

            <StatCard
              label="Total Loans"
              value={stats.totalLoans}
            />

            <StatCard
              label="Pending Loans"
              value={
                stats.pendingLoans
              }
            />

            <StatCard
              label="Fraud Alerts"
              value={
                stats.fraudAlerts
              }
              icon={FiShield}
            />

          </div>
        )}

      {/* ==================================================
          USERS
      ================================================== */}

      {status === "success" &&
        activeTab === "Users" && (
          <div className="space-y-4">

            <form
              onSubmit={
                handleUserSearch
              }
              className="flex gap-2"
            >
              <div className="relative flex-1">

                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search by name or email..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
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

                      <th className="px-4 py-3">
                        Name
                      </th>

                      <th className="px-4 py-3">
                        Email
                      </th>

                      <th className="px-4 py-3">
                        Phone
                      </th>

                      <th className="px-4 py-3">
                        Role
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3">
                        Created
                      </th>

                      <th className="px-4 py-3">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {users.map((u) => (
                      <tr
                        key={u._id}
                      >

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {u.name}
                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {u.email}
                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {u.phone || "—"}
                        </td>

                        <td className="px-4 py-3 capitalize text-slate-500">
                          {u.role}
                        </td>

                        <td className="px-4 py-3">

                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {u.isActive
                              ? "active"
                              : "inactive"}
                          </span>

                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(
                            u.createdAt
                          )}
                        </td>

                        <td className="px-4 py-3">

                          <button
                            onClick={() =>
                              toggleUserStatus(
                                u
                              )
                            }
                            className="text-xs font-medium text-brand-600 hover:underline"
                          >
                            {u.isActive
                              ? "Deactivate"
                              : "Activate"}
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

      {/* ==================================================
          ACCOUNTS
      ================================================== */}

      {status === "success" &&
        activeTab === "Accounts" && (
          <div className="space-y-4">

            {!selectedUser &&
              !selectedAccount && (
                <>

                  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Account Holders
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Accounts are grouped by account holder.
                        </p>
                      </div>

                      <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
                        {accountGroups.length} Account Holders
                      </div>

                    </div>

                  </div>

                  {accountGroups.length === 0 ? (
                    <EmptyState title="No accounts found" />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">

                      <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-slate-100 text-sm">

                          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

                            <tr>

                              <th className="px-5 py-3">
                                Account Holder
                              </th>

                              <th className="px-5 py-3">
                                Email
                              </th>

                              <th className="px-5 py-3">
                                Phone
                              </th>

                              <th className="px-5 py-3 text-center">
                                Accounts
                              </th>

                              <th className="px-5 py-3">
                                Account Types
                              </th>

                              <th className="px-5 py-3 text-right">
                                Details
                              </th>

                            </tr>

                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {accountGroups.map(
                              (group) => {

                                const uniqueTypes = [
                                  ...new Set(
                                    group.accounts.map(
                                      (account) =>
                                        account.accountType
                                    )
                                  ),
                                ];

                                return (
                                  <tr
                                    key={
                                      group.user?._id ||
                                      group.accounts[0]?._id
                                    }
                                    className="transition hover:bg-slate-50"
                                  >

                                    <td className="px-5 py-4">

                                      <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700">
                                          {(
                                            group.user?.name ||
                                            "U"
                                          )
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>

                                        <div>

                                          <p className="font-semibold text-slate-800">
                                            {group.user?.name ||
                                              group.accounts[0]?.fullName ||
                                              "Unknown"}
                                          </p>

                                          <p className="text-xs text-slate-400">
                                            Account holder
                                          </p>

                                        </div>

                                      </div>

                                    </td>

                                    <td className="px-5 py-4 text-slate-500">
                                      {group.user?.email ||
                                        group.accounts[0]?.email ||
                                        "—"}
                                    </td>

                                    <td className="px-5 py-4 text-slate-500">
                                      {group.user?.phone ||
                                        group.accounts[0]?.mobileNumber ||
                                        "—"}
                                    </td>

                                    <td className="px-5 py-4 text-center">

                                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                        {group.accountCount ??
                                          group.accounts.length}
                                      </span>

                                    </td>

                                    <td className="px-5 py-4">

                                      <div className="flex flex-wrap gap-1.5">

                                        {uniqueTypes.map(
                                          (type) => (
                                            <AccountTypeBadge
                                              key={type}
                                              type={type}
                                            />
                                          )
                                        )}

                                      </div>

                                    </td>

                                    <td className="px-5 py-4 text-right">

                                      <button
                                        onClick={() =>
                                          openUserDetails(
                                            group
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                                      >
                                        View Details

                                        <FiChevronRight className="h-3.5 w-3.5" />
                                      </button>

                                    </td>

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>
                  )}

                </>
              )}

            {selectedUser &&
              !selectedAccount && (
                <div className="space-y-5">

                  <button
                    onClick={
                      backToAccountUsers
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <FiArrowLeft />
                    Back to Account Holders
                  </button>

                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-4">

                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
                          {(
                            selectedUser.user?.name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <h2 className="text-xl font-bold text-slate-900">
                            {selectedUser.user?.name ||
                              selectedUser.accounts[0]?.fullName ||
                              "Unknown"}
                          </h2>

                          <p className="text-sm text-slate-500">
                            {selectedUser.user?.email ||
                              selectedUser.accounts[0]?.email ||
                              "—"}
                          </p>

                          <div className="mt-2">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                selectedUser.user?.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {selectedUser.user?.isActive
                                ? "Active User"
                                : "Inactive User"}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="rounded-xl bg-brand-50 px-5 py-4 text-center">

                        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                          Total Accounts
                        </p>

                        <p className="mt-1 text-3xl font-bold text-brand-700">
                          {selectedUser.accountCount ??
                            selectedUser.accounts.length}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                    <h3 className="mb-4 text-base font-semibold text-slate-900">
                      Personal Details
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                      <DetailItem
                        icon={FiUser}
                        label="Full Name"
                        value={
                          selectedUser.user?.name ||
                          selectedUser.accounts[0]?.fullName
                        }
                      />

                      <DetailItem
                        icon={FiMail}
                        label="Email"
                        value={
                          selectedUser.user?.email ||
                          selectedUser.accounts[0]?.email
                        }
                      />

                      <DetailItem
                        icon={FiPhone}
                        label="Phone"
                        value={
                          selectedUser.user?.phone ||
                          selectedUser.accounts[0]?.mobileNumber
                        }
                      />

                      <DetailItem
                        icon={FiMapPin}
                        label="Address"
                        value={
                          selectedUser.user?.address ||
                          selectedUser.accounts[0]?.address
                        }
                      />

                      <DetailItem
                        icon={FiUser}
                        label="Role"
                        value={
                          selectedUser.user?.role
                        }
                      />

                      <DetailItem
                        icon={FiCalendar}
                        label="Registered On"
                        value={
                          selectedUser.user?.createdAt
                            ? formatDateTime(
                                selectedUser.user.createdAt
                              )
                            : ""
                        }
                      />

                    </div>

                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <h3 className="text-base font-semibold text-slate-900">
                          Accounts Created
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Click an account to view complete account details.
                        </p>

                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedUser.accountCount ??
                          selectedUser.accounts.length}{" "}
                        Accounts
                      </span>

                    </div>

                    <div className="space-y-3">

                      {selectedUser.accounts.map(
                        (account) => (
                          <button
                            key={
                              account._id
                            }
                            onClick={() =>
                              openAccountDetails(
                                account
                              )
                            }
                            className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
                          >

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <span className="font-mono text-sm font-bold text-brand-700">
                                    {
                                      account.accountNumber
                                    }
                                  </span>

                                  <AccountTypeBadge
                                    type={
                                      account.accountType
                                    }
                                  />

                                  <AccountStatusBadge
                                    status={
                                      account.status
                                    }
                                  />

                                </div>

                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">

                                  <span>
                                    IFSC:{" "}
                                    <strong>
                                      {
                                        account.ifsc
                                      }
                                    </strong>
                                  </span>

                                  <span>
                                    Currency:{" "}
                                    <strong>
                                      {
                                        account.currency
                                      }
                                    </strong>
                                  </span>

                                  <span>
                                    Created:{" "}
                                    <strong>
                                      {formatDate(
                                        account.createdAt
                                      )}
                                    </strong>
                                  </span>

                                </div>

                              </div>

                              <div className="flex items-center gap-3">

                                <div className="text-right">

                                  <p className="text-xs text-slate-400">
                                    Balance
                                  </p>

                                  <p className="text-lg font-bold text-slate-900">
                                    {formatAmount(
                                      account.balance
                                    )}
                                  </p>

                                </div>

                                <FiChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-brand-600" />

                              </div>

                            </div>

                          </button>
                        )
                      )}

                    </div>

                  </div>

                </div>
              )}

            {selectedAccount && (
              <div className="space-y-5">

                <button
                  onClick={
                    backToUserDetails
                  }
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <FiArrowLeft />
                  Back to User Details
                </button>

                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Account Number
                      </p>

                      <h2 className="mt-1 break-all font-mono text-xl font-bold text-slate-900">
                        {
                          selectedAccount.accountNumber
                        }
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <AccountTypeBadge
                          type={
                            selectedAccount.accountType
                          }
                        />

                        <AccountStatusBadge
                          status={
                            selectedAccount.status
                          }
                        />

                      </div>

                    </div>

                    <div className="rounded-xl bg-slate-50 px-6 py-4 text-right">

                      <p className="text-xs text-slate-400">
                        Current Balance
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatAmount(
                          selectedAccount.balance
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-slate-900">
                    Account Details
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <DetailItem
                      icon={FiHash}
                      label="Account Number"
                      value={
                        selectedAccount.accountNumber
                      }
                    />

                    <DetailItem
                      icon={FiCreditCard}
                      label="Account Type"
                      value={
                        selectedAccount.accountType
                      }
                    />

                    <DetailItem
                      icon={FiDollarSign}
                      label="Balance"
                      value={formatAmount(
                        selectedAccount.balance
                      )}
                    />

                    <DetailItem
                      icon={FiLock}
                      label="IFSC"
                      value={
                        selectedAccount.ifsc
                      }
                    />

                    <DetailItem
                      icon={FiCreditCard}
                      label="Currency"
                      value={
                        selectedAccount.currency
                      }
                    />

                    <DetailItem
                      icon={FiHome}
                      label="Bank"
                      value={
                        selectedAccount.bank?.name ||
                        selectedAccount.bank?.bankName ||
                        selectedAccount.bank?.shortName ||
                        "Bank"
                      }
                    />

                    <DetailItem
                      icon={FiHash}
                      label="UPI ID"
                      value={
                        selectedAccount.upiId
                      }
                    />

                    <DetailItem
                      icon={FiCalendar}
                      label="Created On"
                      value={
                        formatDateTime(
                          selectedAccount.createdAt
                        )
                      }
                    />

                    <DetailItem
                      icon={FiCalendar}
                      label="Last Updated"
                      value={
                        formatDateTime(
                          selectedAccount.updatedAt
                        )
                      }
                    />

                  </div>

                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-slate-900">
                    Account Holder Details
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <DetailItem
                      icon={FiUser}
                      label="Full Name"
                      value={
                        selectedAccount.fullName
                      }
                    />

                    <DetailItem
                      icon={FiMail}
                      label="Email"
                      value={
                        selectedAccount.email
                      }
                    />

                    <DetailItem
                      icon={FiPhone}
                      label="Mobile Number"
                      value={
                        selectedAccount.mobileNumber
                      }
                    />

                    <DetailItem
                      icon={FiCalendar}
                      label="Date of Birth"
                      value={
                        selectedAccount.dateOfBirth
                          ? formatDate(
                              selectedAccount.dateOfBirth
                            )
                          : ""
                      }
                    />

                    <DetailItem
                      icon={FiUser}
                      label="Gender"
                      value={
                        selectedAccount.gender
                      }
                    />

                    <DetailItem
                      icon={FiMapPin}
                      label="Address"
                      value={
                        selectedAccount.address
                      }
                    />

                    <DetailItem
                      icon={FiMapPin}
                      label="City"
                      value={
                        selectedAccount.city
                      }
                    />

                    <DetailItem
                      icon={FiMapPin}
                      label="State"
                      value={
                        selectedAccount.state
                      }
                    />

                    <DetailItem
                      icon={FiMapPin}
                      label="Pincode"
                      value={
                        selectedAccount.pincode
                      }
                    />

                  </div>

                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-slate-900">
                    KYC Details
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">

                    <DetailItem
                      icon={FiCreditCard}
                      label="PAN Number"
                      value={
                        selectedAccount.panNumber
                      }
                    />

                    <DetailItem
                      icon={FiCreditCard}
                      label="Aadhaar Number"
                      value={
                        selectedAccount.aadhaarNumber
                      }
                    />

                  </div>

                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-slate-900">
                    Nominee Details
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <DetailItem
                      icon={FiUser}
                      label="Nominee Name"
                      value={
                        selectedAccount.nomineeName
                      }
                    />

                    <DetailItem
                      icon={FiUser}
                      label="Relationship"
                      value={
                        selectedAccount.nomineeRelationship
                      }
                    />

                    <DetailItem
                      icon={FiPhone}
                      label="Nominee Phone"
                      value={
                        selectedAccount.nomineePhone
                      }
                    />

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      {/* ==================================================
          TRANSACTIONS
      ================================================== */}

      {status === "success" &&
        activeTab === "Transactions" && (
          <div className="space-y-5">

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <h2 className="text-lg font-semibold text-slate-900">
                    Transactions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Transactions are grouped by account holder and account.
                  </p>

                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">

                  <FiFileText className="h-4 w-4" />

                  <span>
                    {transactions.length} transaction
                    {transactions.length !== 1
                      ? "s"
                      : ""}
                  </span>

                </div>

              </div>

              <div className="relative mt-5">

                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={
                    transactionSearch
                  }
                  onChange={(e) =>
                    setTransactionSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search holder, account number, UPI, transaction type..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

              </div>

            </div>

            {transactions.length === 0 ? (
              <EmptyState title="No transactions found" />
            ) : transactionGroups.length === 0 ? (
              <EmptyState title="No matching transactions found" />
            ) : (

              <div className="space-y-4">

                {transactionGroups.map(
                  (group) => {

                    const user =
                      group.user || {};

                    const firstAccount =
                      group.accounts[0]
                        ?.account || {};

                    const holderName =
                      user.name ||
                      firstAccount.fullName ||
                      "Unknown Account Holder";

                    const holderEmail =
                      user.email ||
                      firstAccount.email ||
                      "—";

                    const holderPhone =
                      user.phone ||
                      firstAccount.mobileNumber ||
                      "—";

                    const isUserExpanded =
                      !!expandedTransactionUsers[
                        group.key
                      ];

                    const totalTransactions =
                      group.accounts.reduce(
                        (
                          total,
                          accountGroup
                        ) =>
                          total +
                          accountGroup
                            .transactions
                            .length,
                        0
                      );

                    return (
                      <div
                        key={group.key}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            toggleTransactionUser(
                              group.key
                            )
                          }
                          className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                        >

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {holderName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-semibold text-slate-900">
                                {holderName}
                              </h3>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {group.accounts.length}{" "}
                                account
                                {group.accounts.length !==
                                1
                                  ? "s"
                                  : ""}
                              </span>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {totalTransactions}{" "}
                                transaction
                                {totalTransactions !==
                                1
                                  ? "s"
                                  : ""}
                              </span>

                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">

                              <span className="flex items-center gap-1.5">
                                <FiMail className="h-3.5 w-3.5" />
                                {holderEmail}
                              </span>

                              {holderPhone !== "—" && (
                                <span className="flex items-center gap-1.5">
                                  <FiPhone className="h-3.5 w-3.5" />
                                  {holderPhone}
                                </span>
                              )}

                            </div>

                          </div>

                          {isUserExpanded ? (
                            <FiChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                          ) : (
                            <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                          )}

                        </button>

                        {isUserExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5">

                            <div className="rounded-lg border border-slate-200 bg-white p-4">

                              <div className="mb-4 flex items-center gap-2">

                                <FiUser className="h-4 w-4 text-slate-500" />

                                <h4 className="font-semibold text-slate-800">
                                  Account Holder Details
                                </h4>

                              </div>

                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <div>
                                  <p className="text-xs text-slate-400">
                                    Full Name
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {holderName}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-400">
                                    Email
                                  </p>

                                  <p className="mt-1 break-all text-sm text-slate-700">
                                    {holderEmail}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-400">
                                    Phone
                                  </p>

                                  <p className="mt-1 text-sm text-slate-700">
                                    {holderPhone}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-400">
                                    Role
                                  </p>

                                  <p className="mt-1 capitalize text-sm text-slate-700">
                                    {user.role ||
                                      "member"}
                                  </p>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-2">

                                  <p className="text-xs text-slate-400">
                                    Address
                                  </p>

                                  <p className="mt-1 text-sm text-slate-700">
                                    {user.address ||
                                      firstAccount.address ||
                                      "—"}
                                  </p>

                                </div>

                                <div>

                                  <p className="text-xs text-slate-400">
                                    Account Status
                                  </p>

                                  <p
                                    className={`mt-1 text-sm font-medium ${
                                      user.isActive ===
                                      false
                                        ? "text-red-600"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {user.isActive ===
                                    false
                                      ? "Inactive"
                                      : "Active"}
                                  </p>

                                </div>

                                <div>

                                  <p className="text-xs text-slate-400">
                                    Joined
                                  </p>

                                  <p className="mt-1 text-sm text-slate-700">
                                    {formatDate(
                                      user.createdAt
                                    )}
                                  </p>

                                </div>

                              </div>

                            </div>

                            <div className="mt-5">

                              <div className="mb-3 flex items-center justify-between">

                                <h4 className="font-semibold text-slate-800">
                                  Accounts
                                </h4>

                                <span className="text-xs text-slate-500">
                                  {group.accounts.length}{" "}
                                  account
                                  {group.accounts.length !==
                                  1
                                    ? "s"
                                    : ""}
                                </span>

                              </div>

                              <div className="space-y-3">

                                {group.accounts.map(
                                  (
                                    accountGroup
                                  ) => {

                                    const account =
                                      accountGroup.account ||
                                      {};

                                    const accountKey =
                                      accountGroup.key;

                                    const isAccountExpanded =
                                      !!expandedTransactionAccounts[
                                        accountKey
                                      ];

                                    const accountTransactions =
                                      accountGroup.transactions;

                                    return (
                                      <div
                                        key={
                                          accountKey
                                        }
                                        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                                      >

                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleTransactionAccount(
                                              accountKey
                                            )
                                          }
                                          className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50"
                                        >

                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                            <FiCreditCard className="h-5 w-5 text-slate-600" />
                                          </div>

                                          <div className="min-w-0 flex-1">

                                            <div className="flex flex-wrap items-center gap-2">

                                              <span className="font-mono text-sm font-semibold text-slate-900">
                                                {account.accountNumber ||
                                                  accountGroup.transactions[0]
                                                    ?.accountNumber ||
                                                  "Account Number Unavailable"}
                                              </span>

                                              {account.accountType && (
                                                <AccountTypeBadge
                                                  type={
                                                    account.accountType
                                                  }
                                                />
                                              )}

                                            </div>

                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">

                                              <span>
                                                Balance:{" "}
                                                <span className="font-medium text-slate-700">
                                                  {formatAmount(
                                                    account.balance
                                                  )}
                                                </span>
                                              </span>

                                              {account.ifsc && (
                                                <span>
                                                  IFSC:{" "}
                                                  {
                                                    account.ifsc
                                                  }
                                                </span>
                                              )}

                                              <span>
                                                {
                                                  accountTransactions.length
                                                }{" "}
                                                transaction
                                                {accountTransactions.length !==
                                                1
                                                  ? "s"
                                                  : ""}
                                              </span>

                                            </div>

                                          </div>

                                          {isAccountExpanded ? (
                                            <FiChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                                          ) : (
                                            <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                                          )}

                                        </button>

                                        {isAccountExpanded && (
                                          <div className="border-t border-slate-100">

                                            {accountTransactions.length ===
                                            0 ? (
                                              <div className="p-5 text-center text-sm text-slate-500">
                                                No transactions found for this account.
                                              </div>
                                            ) : (
                                              <div className="divide-y divide-slate-100">

                                                {accountTransactions.map(
                                                  (
                                                    transaction
                                                  ) => {

                                                    const isTransactionExpanded =
                                                      !!expandedTransactions[
                                                        transaction._id
                                                      ];

                                                    const TransactionIcon =
                                                      getTransactionIcon(
                                                        transaction.type
                                                      );

                                                    return (
                                                      <div
                                                        key={
                                                          transaction._id
                                                        }
                                                      >

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            toggleTransaction(
                                                              transaction._id
                                                            )
                                                          }
                                                          className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50"
                                                        >

                                                          <div
                                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getTransactionTypeClass(
                                                              transaction.type
                                                            )}`}
                                                          >
                                                            <TransactionIcon className="h-4 w-4" />
                                                          </div>

                                                          <div className="min-w-0 flex-1">

                                                            <div className="flex flex-wrap items-center gap-2">

                                                              <span className="font-medium capitalize text-slate-800">
                                                                {transaction.type ||
                                                                  "Transaction"}
                                                              </span>

                                                              {transaction.category && (
                                                                <span className="text-xs text-slate-400">
                                                                  •{" "}
                                                                  {
                                                                    transaction.category
                                                                  }
                                                                </span>
                                                              )}

                                                            </div>

                                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                              {transaction.description ||
                                                                "No description"}
                                                            </p>

                                                          </div>

                                                          <div className="text-right">

                                                            <p className="font-semibold text-slate-900">
                                                              {formatAmount(
                                                                transaction.amount
                                                              )}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-400">
                                                              {formatDate(
                                                                transaction.date ||
                                                                  transaction.createdAt
                                                              )}
                                                            </p>

                                                          </div>

                                                          {isTransactionExpanded ? (
                                                            <FiChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                                                          ) : (
                                                            <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                                          )}

                                                        </button>

                                                        {isTransactionExpanded && (
                                                          <div className="border-t border-slate-100 bg-slate-50/60 p-5">

                                                            <div className="mb-4 flex items-center gap-2">

                                                              <FiFileText className="h-4 w-4 text-slate-500" />

                                                              <h5 className="font-semibold text-slate-800">
                                                                Transaction Details
                                                              </h5>

                                                            </div>

                                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                                              <DetailItem
                                                                icon={FiRepeat}
                                                                label="Transaction Type"
                                                                value={
                                                                  transaction.type
                                                                }
                                                              />

                                                              <DetailItem
                                                                icon={FiDollarSign}
                                                                label="Amount"
                                                                value={formatAmount(
                                                                  transaction.amount
                                                                )}
                                                              />

                                                              <DetailItem
                                                                icon={FiFileText}
                                                                label="Category"
                                                                value={
                                                                  transaction.category
                                                                }
                                                              />

                                                              <DetailItem
                                                                icon={FiShield}
                                                                label="Status"
                                                                value={
                                                                  transaction.status
                                                                }
                                                              />

                                                              <DetailItem
                                                                icon={FiCalendar}
                                                                label="Transaction Date"
                                                                value={formatDateTime(
                                                                  transaction.date ||
                                                                    transaction.createdAt
                                                                )}
                                                              />

                                                              <DetailItem
                                                                icon={FiCreditCard}
                                                                label="Account Number"
                                                                value={
                                                                  account.accountNumber ||
                                                                  transaction.accountNumber
                                                                }
                                                              />

                                                              <DetailItem
                                                                icon={FiCreditCard}
                                                                label="Account Type"
                                                                value={
                                                                  account.accountType
                                                                }
                                                              />

                                                              <DetailItem
                                                                icon={FiHash}
                                                                label="Currency"
                                                                value={
                                                                  account.currency ||
                                                                  "INR"
                                                                }
                                                              />

                                                              <div className="sm:col-span-2 lg:col-span-4">

                                                                <DetailItem
                                                                  icon={FiFileText}
                                                                  label="Description"
                                                                  value={
                                                                    transaction.description
                                                                  }
                                                                />

                                                              </div>

                                                              {transaction.receiverName && (
                                                                <DetailItem
                                                                  icon={FiUser}
                                                                  label="Receiver Name"
                                                                  value={
                                                                    transaction.receiverName
                                                                  }
                                                                />
                                                              )}

                                                              {transaction.receiverAccount && (
                                                                <DetailItem
                                                                  icon={FiCreditCard}
                                                                  label="Receiver Account"
                                                                  value={
                                                                    transaction.receiverAccount
                                                                  }
                                                                />
                                                              )}

                                                              {transaction.transferMethod && (
                                                                <DetailItem
                                                                  icon={FiRepeat}
                                                                  label="Transfer Method"
                                                                  value={
                                                                    transaction.transferMethod
                                                                  }
                                                                />
                                                              )}

                                                              {transaction.referenceNumber && (
                                                                <DetailItem
                                                                  icon={FiHash}
                                                                  label="Reference Number"
                                                                  value={
                                                                    transaction.referenceNumber
                                                                  }
                                                                />
                                                              )}

                                                              <DetailItem
                                                                icon={FiCalendar}
                                                                label="Created At"
                                                                value={formatDateTime(
                                                                  transaction.createdAt
                                                                )}
                                                              />

                                                              <DetailItem
                                                                icon={FiCalendar}
                                                                label="Updated At"
                                                                value={formatDateTime(
                                                                  transaction.updatedAt
                                                                )}
                                                              />

                                                            </div>

                                                            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">

                                                              <div className="mb-4 flex items-center gap-2">

                                                                <FiUser className="h-4 w-4 text-slate-500" />

                                                                <h6 className="font-semibold text-slate-800">
                                                                  Account Holder
                                                                </h6>

                                                              </div>

                                                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                                                <DetailItem
                                                                  icon={FiUser}
                                                                  label="Name"
                                                                  value={
                                                                    user.name ||
                                                                    account.fullName
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiMail}
                                                                  label="Email"
                                                                  value={
                                                                    user.email ||
                                                                    account.email
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiPhone}
                                                                  label="Phone"
                                                                  value={
                                                                    user.phone ||
                                                                    account.mobileNumber
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiHash}
                                                                  label="UPI ID"
                                                                  value={
                                                                    account.upiId
                                                                  }
                                                                />

                                                              </div>

                                                            </div>

                                                            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">

                                                              <div className="mb-4 flex items-center gap-2">

                                                                <FiCreditCard className="h-4 w-4 text-slate-500" />

                                                                <h6 className="font-semibold text-slate-800">
                                                                  Account Information
                                                                </h6>

                                                              </div>

                                                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                                                <DetailItem
                                                                  icon={FiHash}
                                                                  label="Account Number"
                                                                  value={
                                                                    account.accountNumber ||
                                                                    transaction.accountNumber
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiCreditCard}
                                                                  label="Account Type"
                                                                  value={
                                                                    account.accountType
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiLock}
                                                                  label="IFSC"
                                                                  value={
                                                                    account.ifsc
                                                                  }
                                                                />

                                                                <DetailItem
                                                                  icon={FiDollarSign}
                                                                  label="Current Balance"
                                                                  value={formatAmount(
                                                                    account.balance
                                                                  )}
                                                                />

                                                              </div>

                                                            </div>

                                                          </div>
                                                        )}

                                                      </div>
                                                    );
                                                  }
                                                )}

                                              </div>
                                            )}

                                          </div>
                                        )}

                                      </div>
                                    );
                                  }
                                )}

                              </div>

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
        )}

      {/* ==================================================
          TRANSFERS
      ================================================== */}

      {status === "success" &&
        activeTab === "Transfers" && (
          <div className="space-y-5">

            {/* =================================================
                TRANSFER HEADER
            ================================================= */}

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                      <FiSend className="h-4 w-4 text-brand-600" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">
                      Transfer History
                    </h2>

                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Search and filter transfers to quickly find a specific transaction.
                  </p>

                </div>

                <div className="flex items-center gap-2">

                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {filteredTransfers.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {transfers.length}
                    </span>{" "}
                    transfers
                  </div>

                </div>

              </div>

              {/* =================================================
                  FILTERS
              ================================================= */}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">

                <div className="mb-4 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <FiFilter className="h-4 w-4 text-slate-500" />

                    <h3 className="text-sm font-semibold text-slate-800">
                      Search & Filters
                    </h3>

                  </div>

                  <button
                    type="button"
                    onClick={
                      resetTransferFilters
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
                  >
                    <FiX className="h-3.5 w-3.5" />
                    Reset Filters
                  </button>

                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                  {/* SEARCH */}

                  <div className="relative md:col-span-2 xl:col-span-2">

                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={
                        transferSearch
                      }
                      onChange={(e) =>
                        setTransferSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search sender, receiver, account, reference..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />

                  </div>

                  {/* STATUS */}

                  <div>

                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Status
                    </label>

                    <select
                      value={
                        transferStatusFilter
                      }
                      onChange={(e) =>
                        setTransferStatusFilter(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >

                      <option value="all">
                        All Statuses
                      </option>

                      {transferStatuses.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {value}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                
                  {/* DATE FROM */}

                  <div>

                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Date From
                    </label>

                    <input
                      type="date"
                      value={
                        transferDateFrom
                      }
                      onChange={(e) =>
                        setTransferDateFrom(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />

                  </div>

                  {/* DATE TO */}

                  <div>

                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Date To
                    </label>

                    <input
                      type="date"
                      value={
                        transferDateTo
                      }
                      onChange={(e) =>
                        setTransferDateTo(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                NO TRANSFERS
            ================================================= */}

            {transfers.length === 0 ? (
              <EmptyState title="No transfers found" />
            ) : filteredTransfers.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white p-10 text-center shadow-sm">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">

                  <FiSearch className="h-5 w-5 text-slate-400" />

                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-800">
                  No matching transfers
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={
                    resetTransferFilters
                  }
                  className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Clear Filters
                </button>

              </div>
            ) : (

              /* =================================================
                 TRANSFER TABLE
              ================================================= */

              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">

                <div className="overflow-x-auto">

                  <table className="min-w-[1250px] divide-y divide-slate-100 text-sm">

                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                      <tr>

                        <th className="px-4 py-3">
                          Sender
                        </th>

                        <th className="px-4 py-3">
                          From Account
                        </th>

                        <th className="px-4 py-3">
                          Receiver
                        </th>

                        <th className="px-4 py-3">
                          To Account
                        </th>

                        <th className="px-4 py-3">
                          Transfer Date
                        </th>

                        <th className="px-4 py-3">
                          Reference ID
                        </th>

                        <th className="px-4 py-3 text-right">
                          Amount
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredTransfers.map(
                        (transfer) => {

                          const sender =
                            getTransferSender(
                              transfer
                            );

                          const receiver =
                            getTransferReceiver(
                              transfer
                            );

                          const fromAccount =
                            getTransferFromAccount(
                              transfer
                            );

                          const toAccount =
                            getTransferToAccount(
                              transfer
                            );

                          const senderName =
                            getPersonName(
                              sender
                            ) ||
                            "Unknown";

                          const receiverName =
                            getPersonName(
                              receiver
                            ) ||
                            "Unknown";

                          const fromAccountNumber =
                            getAccountNumber(
                              fromAccount
                            ) ||
                            "—";

                          const toAccountNumber =
                            getAccountNumber(
                              toAccount
                            ) ||
                            "—";


                          const transferDate =
                            getTransferDate(
                              transfer
                            );

                          const reference =
                            getTransferReference(
                              transfer
                            ) ||
                            "—";

                          const transferStatus =
                            getTransferStatus(
                              transfer
                            );

                          return (
                            <tr
                              key={
                                transfer._id
                              }
                              className="transition hover:bg-slate-50"
                            >

                              {/* SENDER */}

                              <td className="px-4 py-4">

                                <div className="flex min-w-[150px] items-center gap-2.5">

                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                                    {senderName
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate font-medium text-slate-800">
                                      {senderName}
                                    </p>

                                    {sender?.email && (
                                      <p className="max-w-[150px] truncate text-xs text-slate-400">
                                        {
                                          sender.email
                                        }
                                      </p>
                                    )}

                                  </div>

                                </div>

                              </td>

                              {/* FROM ACCOUNT */}

                              <td className="px-4 py-4">

                                <span className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                                  {
                                    fromAccountNumber
                                  }
                                </span>

                              </td>


                              {/* RECEIVER */}

                              <td className="px-4 py-4">

                                <div className="flex min-w-[150px] items-center gap-2.5">

                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                                    {receiverName
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate font-medium text-slate-800">
                                      {receiverName}
                                    </p>

                                    {receiver?.email && (
                                      <p className="max-w-[150px] truncate text-xs text-slate-400">
                                        {
                                          receiver.email
                                        }
                                      </p>
                                    )}

                                  </div>

                                </div>

                              </td>

                              {/* TO ACCOUNT */}

                              <td className="px-4 py-4">

                                <span className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                                  {
                                    toAccountNumber
                                  }
                                </span>

                              </td>


                              {/* DATE */}

                              <td className="px-4 py-4">

                                <div className="flex items-center gap-2">

                                  <FiCalendar className="h-4 w-4 shrink-0 text-slate-400" />

                                  <div>

                                    <p className="whitespace-nowrap text-sm text-slate-700">
                                      {formatDate(
                                        transferDate
                                      )}
                                    </p>

                                    <p className="whitespace-nowrap text-xs text-slate-400">
                                      {transferDate
                                        ? new Date(
                                            transferDate
                                          ).toLocaleTimeString(
                                            "en-IN",
                                            {
                                              hour: "2-digit",
                                              minute:
                                                "2-digit",
                                            }
                                          )
                                        : "—"}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* REFERENCE */}

                              <td className="px-4 py-4">

                                <div className="flex items-center gap-2">

                                  <FiHash className="h-4 w-4 shrink-0 text-slate-400" />

                                  <span
                                    title={
                                      reference
                                    }
                                    className="max-w-[180px] truncate font-mono text-xs text-slate-600"
                                  >
                                    {
                                      reference
                                    }
                                  </span>

                                </div>

                              </td>

                              {/* AMOUNT */}

                              <td className="px-4 py-4 text-right">

                                <span className="whitespace-nowrap font-semibold text-slate-900">
                                  {formatAmount(
                                    transfer.amount
                                  )}
                                </span>

                              </td>

                              {/* STATUS */}

                              <td className="px-4 py-4">

                                <TransferStatusBadge
                                  status={
                                    transferStatus
                                  }
                                />

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

          </div>
        )}

      {/* ==================================================
          LOANS
      ================================================== */}

      {status === "success" &&
        activeTab === "Loans" && (
          <>
            {loans.length === 0 ? (
              <EmptyState title="No loan applications yet" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">

                <table className="min-w-full divide-y divide-slate-100 text-sm">

                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

                    <tr>

                      <th className="px-4 py-3">
                        Applicant
                      </th>

                      <th className="px-4 py-3">
                        Type
                      </th>

                      <th className="px-4 py-3 text-right">
                        Amount
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {loans.map(
                      (loan) => (
                        <tr
                          key={loan._id}
                        >

                          <td className="px-4 py-3 text-slate-800">
                            {loan.user?.name ||
                              "Unknown"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {loan.loanType}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatAmount(
                              loan.amount
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {loan.status}
                          </td>

                          <td className="px-4 py-3">

                            {loan.status ===
                              "Pending" && (
                              <div className="flex gap-2">

                                <button
                                  onClick={() =>
                                    handleLoanStatus(
                                      loan,
                                      "Approved"
                                    )
                                  }
                                  className="text-xs font-medium text-emerald-600 hover:underline"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    handleLoanStatus(
                                      loan,
                                      "Rejected"
                                    )
                                  }
                                  className="text-xs font-medium text-red-600 hover:underline"
                                >
                                  Reject
                                </button>

                              </div>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}
          </>
        )}

      {/* ==================================================
          FRAUD
      ================================================== */}

      {status === "success" &&
        activeTab === "Fraud" && (
          <>
            {fraudAlerts.length === 0 ? (
              <EmptyState title="No fraud alerts." />
            ) : (
              <ul className="space-y-2">

                {fraudAlerts.map(
                  (alert) => (
                    <li
                      key={alert._id}
                      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                    >

                      <div className="flex items-center justify-between">

                        <p className="text-sm font-medium text-slate-800">
                          {alert.user?.name ||
                            "Unknown user"}
                        </p>

                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          {alert.severity}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {alert.message}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(
                          alert.createdAt
                        )}
                      </p>

                    </li>
                  )
                )}

              </ul>
            )}
          </>
        )}

    </div>
  );
};

export default AdminDashboard;