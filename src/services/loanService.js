import api from "./api";

// Get the logged-in user's loans
export const getLoans = async () => {
  const response = await api.get("/loans/my");

  // Backend returns: { loans: [...] }
  const loans = response.data?.loans;

  // Always return an array
  return Array.isArray(loans) ? loans : [];
};

// Apply for a new loan
export const applyForLoan = async (loanData) => {
  const response = await api.post("/loans", loanData);

  // Backend returns: { message, loan }
  return response.data?.loan || response.data;
};

// Get a single loan
export const getLoanById = async (id) => {
  const response = await api.get(`/loans/${id}`);

  return response.data;
};
