import api from "./api";

export const getMyLoans =
  async () => {
    const { data } =
      await api.get(
        "/loans/my"
      );

    return data.loans;
  };

export const getLoanById =
  async (id) => {
    const { data } =
      await api.get(
        `/loans/${id}`
      );

    return data;
  };

export const applyForLoan =
  async (payload) => {
    const { data } =
      await api.post(
        "/loans",
        payload
      );

    return data.loan;
  };