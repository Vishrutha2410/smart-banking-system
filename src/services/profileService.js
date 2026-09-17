import api from "./api";

export const getProfile = async () => {
  const { data } = await api.get("/profile");
  return data.user;
};

export const updateProfileInfo = async (payload) => {
  const { data } = await api.put("/profile", payload);
  return data.user;
};
