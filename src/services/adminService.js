import api from "./api";

// ======================================================
// ADMIN STATS
// ======================================================

export const getAdminStats = async () => {
  const response = await api.get(
    "/admin/stats"
  );

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
// ADMIN CREDIT ACCOUNT
// ======================================================

export const adminCreditAccount = async (
  accountId,
  amount,
  description = ""
) => {
  const response = await api.post(
    `/admin/accounts/${accountId}/credit`,
    {
      amount,
      description,
    }
  );

  return response.data;
};

// ======================================================
// ADMIN DEBIT ACCOUNT
// ======================================================

export const adminDebitAccount = async (
  accountId,
  amount,
  description = ""
) => {
  const response = await api.post(
    `/admin/accounts/${accountId}/debit`,
    {
      amount,
      description,
    }
  );

  return response.data;
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
  /*
   * Always send the status in uppercase.
   *
   * This matches the Loan mongoose enum:
   *
   * PENDING
   * APPROVED
   * REJECTED
   * ACTIVE
   * CLOSED
   */

  const normalizedStatus =
    String(status || "")
      .trim()
      .toUpperCase();

  const response = await api.put(
    `/admin/loans/${loanId}/status`,
    {
      status: normalizedStatus,
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

  // ======================================================
// NEW LOAN MANAGEMENT
// ======================================================

export const getLoanManagementLoans =
  async (params = {}) => {
    const response =
      await api.get(
        "/admin/loan-management",
        {
          params,
        }
      );

    return (
      response.data?.loans ||
      []
    );
  };

export const getLoanManagementDetails =
  async (loanId) => {
    const response =
      await api.get(
        `/admin/loan-management/${loanId}`
      );

    return response.data;
  };

export const approveLoan =
  async (
    loanId,
    approvedAmount,
    comment = ""
  ) => {
    const response =
      await api.put(
        `/admin/loan-management/${loanId}/approve`,
        {
          approvedAmount,
          comment,
        }
      );

    return response.data;
  };

export const rejectLoan =
  async (
    loanId,
    reason
  ) => {
    const response =
      await api.put(
        `/admin/loan-management/${loanId}/reject`,
        {
          reason,
        }
      );

    return response.data;
  };

export const disburseLoan =
  async (loanId) => {
    const response =
      await api.put(
        `/admin/loan-management/${loanId}/disburse`
      );

    return response.data;
  };

export const getAdminLoanRepayments =
  async (loanId) => {
    const response =
      await api.get(
        `/admin/loan-management/${loanId}/repayments`
      );

    return response.data;
  };