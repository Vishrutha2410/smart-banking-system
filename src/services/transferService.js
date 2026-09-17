import api from "./api";

export const getTransfers = async () => {
  const { data } = await api.get("/transfers");
  return data.transfers;
};

export const createTransfer = async (payload) => {
  const { data } = await api.post("/transfers", payload);
  return data;
};
