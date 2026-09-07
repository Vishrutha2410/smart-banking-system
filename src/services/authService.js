import apiRequest from "./api";

export const registerUser = async (userData) => {
  return await apiRequest(
    "/auth/register",
    "POST",
    userData
  );
};

export const loginUser = async (credentials) => {
  return await apiRequest(
    "/auth/login",
    "POST",
    credentials
  );
};