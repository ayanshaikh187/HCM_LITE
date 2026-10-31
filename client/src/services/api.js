
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("hcm_access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    const excludedRoutes = [
      "/auth/login",
      "/auth/refresh",
      "/auth/logout",
    ];

    const isExcluded = excludedRoutes.some((route) =>
      url.includes(route)
    );

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isExcluded
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshApi
          .post("/auth/refresh")
          .then((response) => {
            const newToken = response.data?.data?.accessToken;

            if (!newToken) {
              throw new Error(
                "Refresh response mein access token nahi mila."
              );
            }

            sessionStorage.setItem(
              "hcm_access_token",
              newToken
            );

            return newToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      sessionStorage.removeItem("hcm_access_token");
      sessionStorage.removeItem("hcm_user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
