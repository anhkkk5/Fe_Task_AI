import { get, patch, post, del } from "../../utils/axios/request";

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export type SnoozeDuration = "15min" | "1hour" | "3hour" | "tomorrow";

export type NotificationAction = {
  key: string;
  label: string;
  action: string;
  style?: "primary" | "default" | "danger";
  payload?: Record<string, any>;
};

export interface Notification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  content?: string;
  type?: string;
  priority?: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  link?: string;
  data?: {
    taskId?: string;
    teamId?: string;
    actorId?: string;
    actorName?: string;
    actions?: NotificationAction[];
    [key: string]: any;
  };
  // Snooze
  snoozedUntil?: string | null;
  // Grouping
  isGroup?: boolean;
  groupCount?: number;
  groupedIds?: string[];
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

// Get notifications
export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
}) => {
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

// Snooze a notification. duration can be a preset token or a custom number of minutes.
export const snoozeNotification = async (
  id: string,
  duration: SnoozeDuration | number,
) => {
  const body =
    typeof duration === "number" ? { minutes: duration } : { duration };
  return await post(`/notifications/${id}/snooze`, body);
};

// Remove snooze → bring notification back to the main list immediately
export const unsnoozeNotification = async (id: string) => {
  return await post(`/notifications/${id}/unsnooze`, {});
};

// List currently-snoozed notifications for the logged-in user
export const listSnoozedNotifications = async () => {
  return await get(`/notifications/snoozed/list`);
};

// Expand a group parent → list its children
export const listGroupChildren = async (id: string) => {
  return await get(`/notifications/${id}/group-children`);
};
