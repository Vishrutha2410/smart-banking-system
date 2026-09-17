import api from "./api";

export const getBudgets = async () => {
  const { data } = await api.get("/budgets");
  return data.budgets;
};

export const createBudget = async (payload) => {
  const { data } = await api.post("/budgets", payload);
  return data.budget;
};

export const updateBudget = async (id, payload) => {
  const { data } = await api.put(`/budgets/${id}`, payload);
  return data.budget;
};

export const deleteBudget = async (id) => {
  const { data } = await api.delete(`/budgets/${id}`);
  return data;
};
