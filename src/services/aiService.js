import api from "./api";

export const getFinancialAdvice = async () => {
  const { data } = await api.post("/ai/advisor");
  return data; // { configured, advice? | message?, snapshot }
};

export const sendChatMessage = async (message) => {
  const { data } = await api.post("/ai/chat", { message });
  return data; // { configured, reply | message }
};
