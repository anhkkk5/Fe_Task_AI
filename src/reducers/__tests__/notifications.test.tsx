import { describe, it, expect, vi } from "vitest";
import notificationReducer, {
  addNotification,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "../notifications";

// Mock notificationServices
vi.mock("../../services/notificationServices", () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

describe("Notifications Reducer", () => {
  const initialState = {
    items: [],
    total: 0,
    unreadCount: 0,
    loading: false,
    error: null,
  };

  it("should return initial state", () => {
    expect(notificationReducer(undefined, { type: "unknown" })).toEqual(
      initialState,
    );
  });

  it("should handle addNotification", () => {
    const notification = {
      _id: "1",
      title: "Test",
      message: "Test message",
      isRead: false,
      createdAt: "2024-01-01",
    };

    const state = notificationReducer(
      initialState,
      addNotification(notification),
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(notification);
    expect(state.total).toBe(1);
    expect(state.unreadCount).toBe(1);
  });

  it("should handle fetchNotifications pending", () => {
    const state = notificationReducer(
      initialState,
      fetchNotifications.pending("requestId", {}),
    );
    expect(state.loading).toBe(true);
  });

  it("should handle fetchNotifications fulfilled", () => {
    const notifications = {
      items: [
        {
          _id: "1",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: "2024-01-01",
        },
      ],
      total: 1,
      unreadCount: 1,
    };

    const state = notificationReducer(
      initialState,
      fetchNotifications.fulfilled(notifications, "requestId", {}),
    );
    expect(state.loading).toBe(false);
    expect(state.items).toEqual(notifications.items);
    expect(state.total).toBe(1);
    expect(state.unreadCount).toBe(1);
  });

  it("should handle markAsRead fulfilled", () => {
    const stateWithNotification = {
      ...initialState,
      items: [
        {
          _id: "1",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: "2024-01-01",
        },
      ],
      unreadCount: 1,
    };

    const state = notificationReducer(
      stateWithNotification,
      markAsRead.fulfilled("1", "requestId", "1"),
    );
    expect(state.items[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should handle markAllAsRead fulfilled", () => {
    const stateWithNotifications = {
      ...initialState,
      items: [
        {
          _id: "1",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: "2024-01-01",
        },
        {
          _id: "2",
          title: "Test2",
          message: "Test2",
          isRead: false,
          createdAt: "2024-01-02",
        },
      ],
      unreadCount: 2,
    };

    const state = notificationReducer(
      stateWithNotifications,
      markAllAsRead.fulfilled(undefined, "requestId", undefined),
    );
    expect(state.items.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should handle removeNotification fulfilled", () => {
    const stateWithNotifications = {
      ...initialState,
      items: [
        {
          _id: "1",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: "2024-01-01",
        },
      ],
      total: 1,
      unreadCount: 1,
    };

    const state = notificationReducer(
      stateWithNotifications,
      removeNotification.fulfilled("1", "requestId", "1"),
    );
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.unreadCount).toBe(0);
  });
});
