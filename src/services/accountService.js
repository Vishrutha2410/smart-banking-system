import api from "./api";

export const getAccounts = async () => {
  const { data } = await api.get("/accounts");
  return data.accounts;
};

export const getAccountById = async (id) => {
  const { data } = await api.get(`/accounts/${id}`);
  return data.account;
};

export const createAccount = async (accountType) => {
  const { data } = await api.post("/accounts", { accountType });
  return data.account;
};

export const setAccountStatus = async (id, status) => {
  const { data } = await api.put(`/accounts/${id}/status`, { status });
  return data.account;
};

export const creditAccount = async (id, amount, description) => {
  const { data } = await api.post(`/accounts/${id}/credit`, { amount, description });
  return data; // { account, transaction }
};

export const debitAccount = async (id, amount, description) => {
  const { data } = await api.post(`/accounts/${id}/debit`, { amount, description });
  return data; // { account, transaction }
};
