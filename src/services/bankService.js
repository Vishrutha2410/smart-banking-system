import api from "./api";

export const getBanks =
  async () => {
    const { data } =
      await api.get("/banks");

    return data.banks;
  };