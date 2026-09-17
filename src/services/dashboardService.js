import api from "./api";

export const getDashboardData = async () => {
  const { data } = await api.get("/dashboard");
  return data;
};
