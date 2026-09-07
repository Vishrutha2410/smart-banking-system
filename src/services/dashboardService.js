import apiRequest from "./api";

export const getDashboardSummary =
  async () => {

    return await apiRequest(
      "/dashboard/summary"
    );

  };