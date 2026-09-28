import api from "./api";

export const getStudentProfile =
  async () => {
    const { data } =
      await api.get(
        "/student/profile"
      );

    return data?.profile || null;
  };

export const updateStudentProfile =
  async (payload) => {
    const { data } =
      await api.put(
        "/student/profile",
        payload
      );

    return data?.profile || null;
  };