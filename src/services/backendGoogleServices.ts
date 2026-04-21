// Google API Services via Backend (Passport + JWT)
// FE gọi BE, BE gọi Google API
import axios from "axios";
import { clearAccessToken } from "../utils/axios/request";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

// Types
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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// Axios instance with auth header and cookies
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies
});

apiClient.interceptors.request.use((config) => {
  // Also support localStorage token for backward compatibility
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Check Google connection status
export const getGoogleStatus = async (): Promise<GoogleStatus> => {
  try {
    const response = await apiClient.get("/auth/google/status");
    return response.data;
  } catch (error) {
    return { connected: false };
  }
};

// Redirect to Google OAuth
export const redirectToGoogleAuth = (redirectPath?: string): void => {
  // Clear old tokens before OAuth to prevent mixing sessions
  localStorage.removeItem("token");
  clearAccessToken(); // Clear memory token

  if (redirectPath) {
    sessionStorage.setItem("post_login_redirect", redirectPath);
  }

  window.location.href = `${API_BASE_URL}/auth/google`;
};

// Handle Google callback - extract token from URL
export const handleGoogleCallback = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const error = urlParams.get("error");

  if (error) {
    throw new Error(`Google auth failed: ${error}`);
  }

  if (token) {
    // CRITICAL: Clear old token first to prevent mixing user sessions
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Then save new token
    localStorage.setItem("token", token);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return token;
  }

  return null;
};

// Get Google user info via backend
export const getGoogleUserInfo = async (): Promise<GoogleUserInfo | null> => {
  try {
    const response = await apiClient.get("/auth/google/user");
    return response.data;
  } catch (error) {
    console.error("Failed to get Google user info:", error);
    return null;
  }
};

// Search contacts by email via backend
export const searchGoogleContacts = async (
  query: string,
): Promise<GoogleContact[]> => {
  try {
    const response = await apiClient.get("/auth/google/contacts/search", {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to search contacts:", error);
    return [];
  }
};

// Get contact info by email via backend
export const getContactByEmail = async (
  email: string,
): Promise<GoogleContact | null> => {
  try {
    const response = await apiClient.get(`/auth/google/contacts/${email}`);
    return response.data;
  } catch (error) {
    // Return basic info if not found
    return { email, name: email.split("@")[0] };
  }
};

// Create Google Calendar event with Meet link via backend
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
    console.error("Failed to create Meet link:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    return null;
  }
};

// Legacy functions - no longer needed with Passport approach
// Keeping for compatibility, but they now call backend

// Load Google script - not needed anymore but keeping for compatibility
export const loadGoogleScript = (): Promise<void> => {
  return Promise.resolve(); // No longer needed
};

// Initialize Google Sign-In - now redirects to backend
export const initGoogleSignIn = (
  callback: (token: string, user: GoogleUserInfo) => void,
  errorCallback?: (error: Error) => void,
): void => {
  redirectToGoogleAuth();
};

// Render Google Sign-In button - not needed with custom UI
export const renderGoogleSignInButton = (
  containerId: string,
  onSuccess: (token: string, user: GoogleUserInfo) => void,
  onError?: (error: Error) => void,
): void => {
  // Not implemented - use redirectToGoogleAuth instead
  console.warn("renderGoogleSignInButton not implemented with Passport flow");
};
