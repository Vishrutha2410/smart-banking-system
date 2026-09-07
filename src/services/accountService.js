import apiRequest from "./api";

export const getAccounts = async () => {
  return await apiRequest("/accounts");
};

export const getAccount = async (id) => {
  return await apiRequest(
    `/accounts/${id}`
  );
};

export const createAccount = async (
  accountData
) => {
  return await apiRequest(
    "/accounts",
    "POST",
    accountData
  );
};

export const updateAccountStatus = async (
  id,
  status
) => {
  return await apiRequest(
    `/accounts/${id}/status`,
    "PUT",
    { status }
  );
};