import api from "./api";

export const getInvoices = async () => {
  const { data } =
    await api.get("/invoices");

  return data.invoices || [];
};

export const createInvoice = async (
  payload
) => {
  const { data } =
    await api.post(
      "/invoices",
      payload
    );

  return data.invoice;
};

export const markInvoicePaid =
  async (id) => {
    const { data } =
      await api.put(
        `/invoices/${id}/paid`
      );

    return data.invoice;
  };

export const cancelInvoice =
  async (id) => {
    const { data } =
      await api.put(
        `/invoices/${id}/cancel`
      );

    return data.invoice;
  };