import api from "./api";

export const getBusinessProfile = async () => {
  const { data } = await api.get(
    "/business/profile"
  );

  return data.profile;
};

export const updateBusinessProfile = async (
  payload
) => {
  const { data } = await api.put(
    "/business/profile",
    payload
  );

  return data.profile;
};