import api from "./api";

export const getLoans = async () => {
  const response = await api.get("/loans");

  return (
    response.data?.loans ||
    response.data?.data ||
    response.data ||
    []
  );
};

export const applyForLoan = async (loanData) => {
  const response = await api.post("/loans", loanData);

  return response.data;
};

export const getLoanById = async (id) => {
  const response = await api.get(`/loans/${id}`);

  return response.data;
};

export const updateLoan = async (id, loanData) => {
  const response = await api.put(`/loans/${id}`, loanData);

  return response.data;
};

export const deleteLoan = async (id) => {
  const response = await api.delete(`/loans/${id}`);

  return response.data;
};