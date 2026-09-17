import api from "./api";

export const getTransactions = async (params = {}) => {
  const { data } = await api.get("/transactions", { params });
  return data; // { transactions, pagination }
};

export const getTransactionById = async (id) => {
  const { data } = await api.get(`/transactions/${id}`);
  return data.transaction;
};

export const createTransaction = async (payload) => {
  const { data } = await api.post("/transactions", payload);
  return data;
};
