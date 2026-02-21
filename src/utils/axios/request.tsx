import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL || "").trim() || "http://localhost:3002";
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith("/")
  ? API_BASE_URL
  : `${API_BASE_URL}/`;

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const axiosInstance = axios.create({
  baseURL: NORMALIZED_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${NORMALIZED_BASE_URL}auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = response.data.accessToken;
        accessToken = newAccessToken;
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        accessToken = null;
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const getAccessToken = () => accessToken;

export const get = async <T = any,>(path: string): Promise<T> => {
  const response = await axiosInstance.get<T>(path);
  return response.data;
};

export const post = async <T = any,>(path: string, data: any): Promise<T> => {
  const response = await axiosInstance.post<T>(path, data);
  return response.data;
};

export const postForm = async <T = any,>(
  path: string,
  formData: FormData,
): Promise<T> => {
  const response = await axiosInstance.post<T>(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const del = async <T = any,>(path: string): Promise<T> => {
  const response = await axiosInstance.delete<T>(path);
  return response.data;
};

export const edit = async <T = any,>(path: string, data: any): Promise<T> => {
  const response = await axiosInstance.patch<T>(path, data);
  return response.data;
};

// Alias for edit (PATCH method)
export const patch = edit;

export const editForm = async <T = any,>(
  path: string,
  formData: FormData,
): Promise<T> => {
  const response = await axiosInstance.patch<T>(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export default axiosInstance;
