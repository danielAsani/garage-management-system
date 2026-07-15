import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function clearAuthSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.dispatchEvent(new Event("auth:logout"));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refresh = localStorage.getItem("refresh");

    if (error.response?.status === 401 && refresh && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh,
        });

        localStorage.setItem("access", response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        return api(originalRequest);
      } catch {
        clearAuthSession();
      }
    }

    if (error.response?.status === 401) {
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

export function getListData(response) {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.results || [];
}

export async function getPageData(url) {
  const response = await api.get(url);

  if (Array.isArray(response.data)) {
    return {
      count: response.data.length,
      results: response.data,
    };
  }

  return {
    count: response.data.count ?? 0,
    results: response.data.results || [],
  };
}

export async function getAllPages(url) {
  const response = await api.get(url);

  if (Array.isArray(response.data)) {
    return response.data;
  }

  let results = response.data.results || [];
  let nextUrl = response.data.next;

  while (nextUrl) {
    const nextResponse = await api.get(nextUrl);
    results = [...results, ...(nextResponse.data.results || [])];
    nextUrl = nextResponse.data.next;
  }

  return results;
}

export function getErrorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey = Object.keys(data)[0];
  const value = data[firstKey];

  if (Array.isArray(value)) {
    return `${firstKey}: ${value.join(" ")}`;
  }

  if (typeof value === "string") {
    return `${firstKey}: ${value}`;
  }

  return fallback;
}

export function getMediaUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
}

export default api;
