import api from "./api";

// ---------------------------------------------
// Get all accounts
// ---------------------------------------------

export const getAccounts = async () => {
  const { data } = await api.get(
    "/accounts"
  );

  return Array.isArray(
    data?.accounts
  )
    ? data.accounts
    : [];
};

// ---------------------------------------------
// Get available banks
// ---------------------------------------------

export const getBanks = async () => {
  const { data } = await api.get(
    "/accounts/banks"
  );

  return Array.isArray(
    data?.banks
  )
    ? data.banks
    : [];
};

// ---------------------------------------------
// Get single account
// ---------------------------------------------

export const getAccountById = async (
  id
) => {
  const { data } =
    await api.get(
      `/accounts/${id}`
    );

  return data.account;
};

// ---------------------------------------------
// Create account
// ---------------------------------------------

export const createAccount = async (
  accountData
) => {
  const { data } =
    await api.post(
      "/accounts",
      accountData
    );

  return data.account;
};

// ---------------------------------------------
// Change account status
// ---------------------------------------------

export const setAccountStatus = async (
  id,
  status
) => {
  const { data } =
    await api.put(
      `/accounts/${id}/status`,
      { status }
    );

  return data.account;
};

// ---------------------------------------------
// Credit account
// ---------------------------------------------

export const creditAccount = async (
  id,
  amount,
  description
) => {
  const { data } =
    await api.post(
      `/accounts/${id}/credit`,
      {
        amount,
        description,
      }
    );

  return data;
};

// ---------------------------------------------
// Debit account
// ---------------------------------------------

export const debitAccount = async (
  id,
  amount,
  description
) => {
  const { data } =
    await api.post(
      `/accounts/${id}/debit`,
      {
        amount,
        description,
      }
    );

  return data;
};