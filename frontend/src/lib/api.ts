import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token getter — set by useClerkToken hook
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  _getToken = getter;
}

// Request interceptor — add auth token when available
api.interceptors.request.use(async (config) => {
  // Try Clerk token first, fallback to localStorage
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback: localStorage (dev mode without Clerk)
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

export default api;
