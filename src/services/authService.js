import api from "./api";

export const registerUser = async (payload) => {
  // payload: { name, email, phone, password, confirmPassword, role, adminCode }
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const loginUser = async (payload) => {
  // payload: { email, password, role }
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data.user;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/auth/profile", payload);
  return data.user;
};

export const changePassword = async (payload) => {
  // payload: { currentPassword, newPassword, confirmPassword }
  const { data } = await api.put("/auth/password", payload);
  return data;
};
