import axios from "axios";
import { clearAccessToken } from "../utils/axios/request";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleContact {
  email: string;
  name?: string;
  photoUrl?: string;
}

export interface GoogleMeetLink {
  conferenceId: string;
  meetingUri: string;
}

export interface GoogleStatus {
  connected: boolean;
  user?: {
    userId: string;
    email: string;
    name: string;
    picture?: string;
  };
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getGoogleStatus = async (): Promise<GoogleStatus> => {
  try {
    const response = await apiClient.get("/auth/google/status");
    return response.data;
  } catch (error) {
    return { connected: false };
  }
};

export const redirectToGoogleAuth = (redirectPath?: string): void => {
  localStorage.removeItem("token");
  clearAccessToken();

  if (redirectPath) {
    sessionStorage.setItem("post_login_redirect", redirectPath);
  }

  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const handleGoogleCallback = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const error = urlParams.get("error");

  if (error) {
    throw new Error(`Google auth failed: ${error}`);
  }

  if (token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
    return token;
  }

  return null;
};

export const getGoogleUserInfo = async (): Promise<GoogleUserInfo | null> => {
  try {
    const response = await apiClient.get("/auth/google/user");
    return response.data;
  } catch {
    return null;
  }
};

export const searchGoogleContacts = async (
  query: string,
): Promise<GoogleContact[]> => {
  try {
    const response = await apiClient.get("/auth/google/contacts/search", {
      params: { query },
    });
    return response.data;
  } catch {
    return [];
  }
};

export const getContactByEmail = async (
  email: string,
): Promise<GoogleContact | null> => {
  try {
    const response = await apiClient.get(`/auth/google/contacts/${email}`);
    return response.data;
  } catch {
    return { email, name: email.split("@")[0] };
  }
};

export const createGoogleMeetLink = async (params: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  guests?: string[];
}): Promise<GoogleMeetLink | null> => {
  try {
    const response = await apiClient.post("/auth/google/meet", params);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    return null;
  }
};

export const loadGoogleScript = (): Promise<void> => {
  return Promise.resolve(); // No longer needed
};

export const initGoogleSignIn = (
  _callback: (token: string, user: GoogleUserInfo) => void,
  _errorCallback?: (error: Error) => void,
): void => {
  redirectToGoogleAuth();
};

export const renderGoogleSignInButton = (
  _containerId: string,
  _onSuccess: (token: string, user: GoogleUserInfo) => void,
  _onError?: (error: Error) => void,
): void => {
  // noop — use redirectToGoogleAuth instead
};
