import { get, patch, del } from "../../utils/axios/request";

export interface Notification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

// Get notifications
export const getNotifications = async (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/notifications?${queryString}` : "/notifications";
  return await get(url);
};

// Mark notification as read
export const markNotificationAsRead = async (id: string) => {
  return await patch(`/notifications/${id}/read`, {});
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  return await patch("/notifications/read-all", {});
};

// Delete notification
export const deleteNotification = async (id: string) => {
  return await del(`/notifications/${id}`);
};
