import { describe, it, expect, vi } from "vitest";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../notificationServices";

// Mock axios request
vi.mock("../../utils/axios/request", () => ({
  get: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

describe("Notification Services", () => {
  it("should call getNotifications with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getNotifications();
    expect(get).toHaveBeenCalledWith("/notifications");
  });

  it("should call getNotifications with query params", async () => {
    const { get } = await import("../../utils/axios/request");
    await getNotifications({ page: 1, limit: 10 });
    expect(get).toHaveBeenCalledWith("/notifications?page=1&limit=10");
  });

  it("should call markNotificationAsRead with correct URL", async () => {
    const { patch } = await import("../../utils/axios/request");
    await markNotificationAsRead("123");
    expect(patch).toHaveBeenCalledWith("/notifications/123/read", {});
  });

  it("should call markAllNotificationsAsRead with correct URL", async () => {
    const { patch } = await import("../../utils/axios/request");
    await markAllNotificationsAsRead();
    expect(patch).toHaveBeenCalledWith("/notifications/read-all", {});
  });

  it("should call deleteNotification with correct URL", async () => {
    const { del } = await import("../../utils/axios/request");
    await deleteNotification("123");
    expect(del).toHaveBeenCalledWith("/notifications/123");
  });
});
