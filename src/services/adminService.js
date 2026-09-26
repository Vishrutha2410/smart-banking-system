import api from "./api";

// ======================================================
// ADMIN STATS
// ======================================================

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");

  return response.data;
};

// ======================================================
// ADMIN USERS
// ======================================================

export const getAdminUsers = async (
  params = {}
) => {
  const response = await api.get(
    "/admin/users",
    {
      params,
    }
  );

  return response.data.users;
};

// ======================================================
// USER STATUS
// ======================================================

export const setUserStatus = async (
  userId,
  isActive
) => {
  const response = await api.put(
    `/admin/users/${userId}/status`,
    {
      isActive,
    }
  );

  return response.data.user;
};

// ======================================================
// ADMIN ACCOUNTS
// ======================================================

export const getAdminAccounts =
  async () => {
    const response = await api.get(
      "/admin/accounts"
    );

    return response.data.accounts;
  };

// ======================================================
// ADMIN USER ACCOUNT DETAILS
// ======================================================

export const getAdminUserAccounts =
  async (userId) => {
    const response = await api.get(
      `/admin/accounts/user/${userId}`
    );

    return response.data;
  };

// ======================================================
// ADMIN SINGLE ACCOUNT DETAILS
// ======================================================

export const getAdminAccountDetails =
  async (accountId) => {
    const response = await api.get(
      `/admin/accounts/${accountId}`
    );

    return response.data.account;
  };

// ======================================================
// TRANSACTIONS
// ======================================================

export const getAdminTransactions =
  async (params = {}) => {
    const response = await api.get(
      "/admin/transactions",
      {
        params,
      }
    );

    return response.data;
  };

// ======================================================
// TRANSFERS
// ======================================================

export const getAdminTransfers =
  async () => {
    const response = await api.get(
      "/admin/transfers"
    );

    return response.data.transfers;
  };

// ======================================================
// LOANS
// ======================================================

export const getAdminLoans =
  async (params = {}) => {
    const response = await api.get(
      "/admin/loans",
      {
        params,
      }
    );

    return response.data.loans;
  };

// ======================================================
// LOAN STATUS
// ======================================================

export const setLoanStatus = async (
  loanId,
  status
) => {
  const response = await api.put(
    `/admin/loans/${loanId}/status`,
    {
      status,
    }
  );

  return response.data.loan;
};

// ======================================================
// FRAUD
// ======================================================

export const getAdminFraudAlerts =
  async () => {
    const response = await api.get(
      "/admin/fraud"
    );

    return response.data.alerts;
  };