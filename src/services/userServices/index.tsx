import { get, patch, del } from "../../utils/axios/request";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  reminderMinutes: number;
}

// Get all users (admin)
export const getUsers = async (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/users?${queryString}` : "/users";
  return await get(url);
};

// Get user by ID
export const getUserById = async (id: string) => {
  return await get(`/users/${id}`);
};

// Update profile
export const updateProfile = async (data: UpdateProfileData) => {
  return await patch("/users/profile", data);
};

// Change password
export const changePassword = async (data: ChangePasswordData) => {
  return await patch("/users/change-password", data);
};

// Delete user (admin)
export const deleteUser = async (id: string) => {
  return await del(`/users/${id}`);
};

// Notification settings (current user)
export const getNotificationSettings = async () => {
  return await get("/users/notification-settings");
};

export const updateNotificationSettings = async (
  data: NotificationSettings,
) => {
  return await patch("/users/notification-settings", data);
};
