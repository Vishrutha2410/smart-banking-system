import api from "./api";

export const getReceipts = async () => {
  const { data } = await api.get("/receipts");
  return data; // { receipts, ocrAvailable }
};

// Uploads a receipt image for OCR. Returns extracted fields ONLY -
// does not save a receipt or create a transaction.
export const scanReceipt = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/receipts/scan", formData);
  return data; // { merchant, date, amount, category, rawText }
};

export const createReceipt = async (payload) => {
  const { data } = await api.post("/receipts", payload);
  return data; // { receipt, ocrAvailable }
};

export const deleteReceipt = async (id) => {
  const { data } = await api.delete(`/receipts/${id}`);
  return data;
};