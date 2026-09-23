import api from "./api";

// ===============================
// ADMIN STATISTICS
// ===============================
export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");

  return (
    response.data?.stats ||
    response.data?.data ||
    response.data ||
    {}
  );
};

// ===============================
// USERS
// ===============================
export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");

  return (
    response.data?.users ||
    response.data?.data ||
    response.data ||
    []
  );
};

export const setUserStatus = async (userId, status) => {
  const response = await api.put(`/admin/users/${userId}/status`, {
    status,
  });

  return response.data;
};

// ===============================
// ACCOUNTS
// ===============================
export const getAdminAccounts = async () => {
  const response = await api.get("/admin/accounts");

  return (
    response.data?.accounts ||
    response.data?.data ||
    response.data ||
    []
  );
};

// ===============================
// TRANSACTIONS
// ===============================
export const getAdminTransactions = async () => {
  const response = await api.get("/admin/transactions");

  return (
    response.data?.transactions ||
    response.data?.data ||
    response.data ||
    []
  );
};

// ===============================
// TRANSFERS
// ===============================
export const getAdminTransfers = async () => {
  const response = await api.get("/admin/transfers");

  return (
    response.data?.transfers ||
    response.data?.data ||
    response.data ||
    []
  );
};

// ===============================
// LOANS
// ===============================
export const getAdminLoans = async () => {
  const response = await api.get("/admin/loans");

  return (
    response.data?.loans ||
    response.data?.data ||
    response.data ||
    []
  );
};

export const setLoanStatus = async (loanId, status) => {
  const response = await api.put(`/admin/loans/${loanId}/status`, {
    status,
  });

  return response.data;
};

// ===============================
// FRAUD ALERTS
// ===============================
export const getAdminFraudAlerts = async () => {
  const response = await api.get("/admin/fraud-alerts");

  return (
    response.data?.alerts ||
    response.data?.fraudAlerts ||
    response.data?.data ||
    response.data ||
    []
  );
};

// ===============================
// DEFAULT EXPORT
// ===============================
export default {
  getAdminStats,
  getAdminUsers,
  setUserStatus,
  getAdminAccounts,
  getAdminTransactions,
  getAdminTransfers,
  getAdminLoans,
  setLoanStatus,
  getAdminFraudAlerts,
};
