import api from "./api";

export const getBeneficiaries =
  async () => {
    const { data } =
      await api.get(
        "/beneficiaries"
      );

    return data.beneficiaries;
  };

export const addBeneficiary =
  async (payload) => {
    const { data } =
      await api.post(
        "/beneficiaries",
        payload
      );

    return data.beneficiary;
  };

export const updateBeneficiary =
  async (id, payload) => {
    const { data } =
      await api.put(
        `/beneficiaries/${id}`,
        payload
      );

    return data.beneficiary;
  };

export const deleteBeneficiary =
  async (id) => {
    const { data } =
      await api.delete(
        `/beneficiaries/${id}`
      );

    return data;
  };