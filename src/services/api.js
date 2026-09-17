import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    if (status === 401) {
      // Token invalid/expired - clear auth state and force re-login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      console.warn("[API] Forbidden:", message);
    }

    if (status === 404) {
      console.warn("[API] Not found:", message);
    }

    if (status === 500) {
      console.error("[API] Server error:", message);
    }

    return Promise.reject({
      status,
      message,
      raw: error,
    });
  }
);

export default api;
