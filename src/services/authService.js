import api from "./api";

// ======================================================
// REGISTER
// ======================================================
//
// payload:
//
// {
//   name,
//   email,
//   phone,
//   password,
//   confirmPassword,
//   role,
//   customerType,
//   adminCode
// }
//
// customerType:
// personal | student | business
// ======================================================

export const registerUser = async (
  payload
) => {
  const { data } =
    await api.post(
      "/auth/register",
      payload
    );

  return data;
};

// ======================================================
// LOGIN
// ======================================================

export const loginUser = async (
  payload
) => {
  const { data } =
    await api.post(
      "/auth/login",
      payload
    );

  return data;
};

// ======================================================
// CURRENT USER
// ======================================================

export const fetchCurrentUser =
  async () => {
    const { data } =
      await api.get(
        "/auth/me"
      );

    return data.user;
  };

// ======================================================
// UPDATE PROFILE
// ======================================================

export const updateProfile =
  async (payload) => {
    const { data } =
      await api.put(
        "/auth/profile",
        payload
      );

    return data.user;
  };

// ======================================================
// CHANGE PASSWORD
// ======================================================

export const changePassword =
  async (payload) => {
    const { data } =
      await api.put(
        "/auth/password",
        payload
      );

    return data;
  };