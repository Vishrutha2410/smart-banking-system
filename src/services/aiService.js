import api from "./api";

export const getFinancialAdvice = async () => {
  const { data } = await api.post("/ai/advisor");

  return data;
};

export const sendChatMessage = async (message) => {
  const { data } = await api.post("/ai/chat", {
    message,
  });

  return data;
};