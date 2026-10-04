import api from "./api";

/**
 * Get normal financial report
 *
 * Supported periods:
 * - monthly
 * - yearly
 * - custom
 */
export const getReports = async (params = {}) => {
  const { data } = await api.get("/reports", {
    params,
  });

  return data;
};

/**
 * Get bank statement data
 *
 * The backend prepares the statement from the
 * authenticated user's real MongoDB accounts
 * and transactions.
 */
export const getBankStatement = async (params = {}) => {
  const { data } = await api.get("/reports/statement", {
    params,
  });

  return data;
};
