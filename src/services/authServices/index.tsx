import {
  post,
  postForm,
  setAccessToken,
  clearAccessToken,
} from "../../utils/axios/request";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await post<LoginResponse>("/auth/login", data);
  // Lưu access token vào memory (không lưu localStorage)
  setAccessToken(response.accessToken);
  return response;
};

export const registerUser = async (data: RegisterData): Promise<void> => {
  return await post("/auth/register", data);
};

export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  return await post("/auth/verify-otp", { email, otp });
};

export const resendOtp = async (email: string): Promise<void> => {
  return await post("/auth/resend-otp", { email });
};

export const logoutUser = async (): Promise<void> => {
  return await post("/auth/logout", {});
};

export const getMe = async () => {
  return await post("/auth/me", {});
};

export const updateProfile = async (data: {
  name?: string;
  avatar?: string;
}) => {
  return await post("/auth/update-profile", data);
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await postForm<{ url: string }>(
    "/auth/upload-avatar",
    formData,
  );
  return response.url;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await post<{ accessToken: string }>(
    "/auth/refresh-token",
    {},
  );
  // Lưu access token mới vào memory
  setAccessToken(response.accessToken);
  return response;
};

// Forgot Password APIs
export const forgotPassword = async (email: string): Promise<void> => {
  return await post("/auth/forgot-password", { email });
};

export const verifyForgotPasswordOtp = async (
  email: string,
  otp: string,
): Promise<void> => {
  return await post("/auth/verify-forgot-password-otp", { email, otp });
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> => {
  return await post("/auth/reset-password", { email, otp, newPassword });
};
