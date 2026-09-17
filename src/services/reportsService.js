import api from "./api";

export const getReports = async (params = {}) => {
  const { data } = await api.get("/reports", { params });
  return data;
};
