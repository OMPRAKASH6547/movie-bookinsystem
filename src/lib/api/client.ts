import axios from "axios";
import { API_PREFIX } from "@/constants";

export const api = axios.create({
  baseURL: API_PREFIX,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("cinepass-auth");
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_PREFIX}/auth/refresh`, {}, { withCredentials: true });
        if (data?.data?.accessToken && typeof window !== "undefined") {
          const stored = localStorage.getItem("cinepass-auth");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.state.accessToken = data.data.accessToken;
            localStorage.setItem("cinepass-auth", JSON.stringify(parsed));
          }
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cinepass-auth");
        }
      }
    }
    return Promise.reject(error);
  }
);
