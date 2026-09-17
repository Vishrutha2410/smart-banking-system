import api from "./api";

export const getLoans = async () => {
  const { data } = await api.get("/loans");
  return data.loans;
};

export const getLoanById = async (id) => {
  const { data } = await api.get(`/loans/${id}`);
  return data.loan;
};

export const applyForLoan = async (payload) => {
  // payload: { loanType, amount, tenure, purpose }
  const { data } = await api.post("/loans", payload);
  return data.loan;
};
