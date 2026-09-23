import api from "./api";

export const getAdminStats =
  async () => {
    const { data } =
      await api.get(
        "/admin/stats"
      );

    return data;
  };

export const getAdminUsers =
  async (params = {}) => {
    const { data } =
      await api.get(
        "/admin/users",
        { params }
      );

    return data.users;
  };

export const setUserStatus =
  async (
    id,
    isActive
  ) => {
    const { data } =
      await api.put(
        `/admin/users/${id}/status`,
        { isActive }
      );

    return data.user;
  };

export const getAdminAccounts =
  async () => {
    const { data } =
      await api.get(
        "/admin/accounts"
      );

    return data.accounts;
  };

export const getAdminTransactions =
  async (params = {}) => {
    const { data } =
      await api.get(
        "/admin/transactions",
        { params }
      );

    return data;
  };

export const getAdminTransfers =
  async () => {
    const { data } =
      await api.get(
        "/admin/transfers"
      );

    return data.transfers;
  };

export const getAdminLoans =
  async (params = {}) => {
    const { data } =
      await api.get(
        "/admin/loans",
        { params }
      );

    return data;
  };

export const approveLoan =
  async (
    id,
    payload
  ) => {
    const { data } =
      await api.put(
        `/admin/loans/${id}/approve`,
        payload
      );

    return data.loan;
  };

export const rejectLoan =
  async (
    id,
    reason
  ) => {
    const { data } =
      await api.put(
        `/admin/loans/${id}/reject`,
        { reason }
      );

    return data.loan;
  };

export const requestLoanDocuments =
  async (
    id,
    comment
  ) => {
    const { data } =
      await api.put(
        `/admin/loans/${id}/documents-required`,
        { comment }
      );

    return data.loan;
  };

export const getLoanHistory =
  async (id) => {
    const { data } =
      await api.get(
        `/admin/loans/${id}/history`
      );

    return data.history;
  };

export const getAdminFraudAlerts =
  async () => {
    const { data } =
      await api.get(
        "/admin/fraud"
      );

    return data.alerts;
  };