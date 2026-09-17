import api from "./api";

export const getFraudAlerts = async () => {
  const { data } = await api.get("/fraud");
  return data.alerts;
};

export const setFraudAlertStatus = async (id, status) => {
  const { data } = await api.put(`/fraud/${id}/status`, { status });
  return data.alert;
};
