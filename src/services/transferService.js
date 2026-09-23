import api from "./api";

/**
 * Get logged-in user's transfers
 */
export const getTransfers = async () => {
  const response = await api.get("/transfers");

  return response.data?.transfers ||
    response.data?.data ||
    response.data ||
    [];
};

/**
 * Create a new transfer
 */
export const createTransfer = async (transferData) => {
  const response = await api.post(
    "/transfers",
    transferData
  );

  return response.data;
};

/**
 * Get a single transfer
 */
export const getTransferById = async (id) => {
  const response = await api.get(`/transfers/${id}`);

  return response.data;
};