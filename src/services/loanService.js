import api from "./api";

// Get the logged-in user's loans
export const getLoans = async () => {
  const response = await api.get("/loans/my");

  return (
    response.data?.loans ||
    response.data?.data ||
    response.data ||
    []
  );
};

// Apply for a new loan
export const applyForLoan = async (loanData) => {
  const response = await api.post("/loans", loanData);

  return response.data;
};

// Get a single loan
export const getLoanById = async (id) => {
  const response = await api.get(`/loans/${id}`);

  return response.data;
};
