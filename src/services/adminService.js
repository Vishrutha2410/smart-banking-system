import api from "./api";

export const getAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const getAdminUsers = async (params = {}) => {
  const { data } = await api.get("/admin/users", { params });
  return data.users;
};

export const setUserStatus = async (id, isActive) => {
  const { data } = await api.put(`/admin/users/${id}/status`, { isActive });
  return data.user;
};

export const getAdminAccounts = async () => {
  const { data } = await api.get("/admin/accounts");
  return data.accounts;
};

export const getAdminTransactions = async (params = {}) => {
  const { data } = await api.get("/admin/transactions", { params });
  return data;
};

export const getAdminTransfers = async () => {
  const { data } = await api.get("/admin/transfers");
  return data.transfers;
};

export const getAdminLoans = async (params = {}) => {
  const { data } = await api.get("/admin/loans", { params });
  return data.loans;
};

export const setLoanStatus = async (id, status) => {
  const { data } = await api.put(`/admin/loans/${id}/status`, { status });
  return data.loan;
};

export const getAdminFraudAlerts = async () => {
  const { data } = await api.get("/admin/fraud");
  return data.alerts;
};
