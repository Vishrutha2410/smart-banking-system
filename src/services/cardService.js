import api from "./api";

export const getCards = async () => {
  const { data } = await api.get("/cards");
  return data.cards;
};

export const requestCard = async (payload) => {
  // payload: { accountId, cardType, spendingLimit }
  const { data } = await api.post("/cards", payload);
  return data.card;
};

export const setCardStatus = async (id, status) => {
  const { data } = await api.put(`/cards/${id}/status`, { status });
  return data.card;
};
