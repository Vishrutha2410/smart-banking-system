import api from "./api";

// ======================================================
// GET USER LOANS
// ======================================================

export const getLoans = async () => {
  const response =
    await api.get("/loans/my");

  const loans =
    response.data?.loans;

  return Array.isArray(loans)
    ? loans
    : [];
};

// ======================================================
// APPLY FOR LOAN
// ======================================================

export const applyForLoan =
  async (loanData) => {
    const response =
      await api.post(
        "/loans",
        loanData
      );

    return (
      response.data?.loan ||
      response.data
    );
  };

// ======================================================
// GET SINGLE LOAN
// ======================================================

export const getLoanById =
  async (id) => {
    const response =
      await api.get(
        `/loans/${id}`
      );

    return response.data;
  };

// ======================================================
// GET REPAYMENT SCHEDULE
// ======================================================

export const getLoanRepayments =
  async (id) => {
    const response =
      await api.get(
        `/loans/${id}/repayments`
      );

    return response.data;
  };

// ======================================================
// PAY NEXT EMI
// ======================================================

export const payLoanRepayment =
  async (
    loanId,
    paymentAccountId
  ) => {
    const response =
      await api.post(
        `/loans/${loanId}/repay`,
        {
          paymentAccountId,
        }
      );

    return response.data;
  };