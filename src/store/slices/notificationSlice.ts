import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  snoozeNotification,
  unsnoozeNotification,
  type Notification,
  type SnoozeDuration,
} from "../../services/notificationServices";

interface NotificationState {
  items: Notification[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (params?: { page?: number; limit?: number }) => {
    const response = await getNotifications(params);
    return response;
  },
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id: string) => {
    await markNotificationAsRead(id);
    return id;
  },
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async () => {
    await markAllNotificationsAsRead();
  },
);

export const removeNotification = createAsyncThunk(
  "notifications/delete",
  async (id: string) => {
    await deleteNotification(id);
    return id;
  },
);

export const snoozeNotificationThunk = createAsyncThunk(
  "notifications/snooze",
  async (payload: { id: string; duration: SnoozeDuration | number }) => {
    await snoozeNotification(payload.id, payload.duration);
    return payload.id;
  },
);

export const unsnoozeNotificationThunk = createAsyncThunk(
  "notifications/unsnooze",
  async (payload: { id: string; notification: Notification }) => {
    await unsnoozeNotification(payload.id);
    return payload.notification;
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.total += 1;
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    // Upsert: update existing notification in place (realtime group update) or insert
    upsertNotification: (state, action) => {
      const incoming = action.payload as Notification;
      const incomingId = incoming._id || incoming.id;
      const idx = state.items.findIndex((n) => (n._id || n.id) === incomingId);
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...incoming };
      } else {
        state.items.unshift(incoming);
        state.total += 1;
        if (!incoming.isRead) state.unreadCount += 1;
      }
    },
    // Remove by ID (used by socket notification:delete or local snooze hide)
    removeNotificationById: (state, action) => {
      const id = action.payload as string;
      const idx = state.items.findIndex((n) => (n._id || n.id) === id);
      if (idx >= 0) {
        const removed = state.items[idx];
        if (!removed.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items.splice(idx, 1);
        state.total = Math.max(0, state.total - 1);
      }
    },
    clearNotifications: (state) => {
      state.items = [];
      state.total = 0;
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch notifications";
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.items.find(
          (n) => (n._id || n.id) === action.payload,
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => (n.isRead = true));
        state.unreadCount = 0;
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (n) => (n._id || n.id) === action.payload,
        );
        if (index !== -1) {
          const removed = state.items[index];
          if (!removed.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items.splice(index, 1);
          state.total -= 1;
        }
      })
      .addCase(snoozeNotificationThunk.fulfilled, (state, action) => {
        // Snooze → hide from main list (behaves like delete for UI)
        const id = action.payload;
        const index = state.items.findIndex((n) => (n._id || n.id) === id);
        if (index !== -1) {
          const removed = state.items[index];
          if (!removed.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items.splice(index, 1);
          state.total = Math.max(0, state.total - 1);
        }
      })
      .addCase(unsnoozeNotificationThunk.fulfilled, (state, action) => {
        // Unsnooze → bring notification back to top
        const n = action.payload;
        const exists = state.items.find(
          (it) => (it._id || it.id) === (n._id || n.id),
        );
        if (!exists) {
          state.items.unshift({ ...n, snoozedUntil: null });
          state.total += 1;
          if (!n.isRead) state.unreadCount += 1;
        }
      });
  },
});

export const {
  addNotification,
  upsertNotification,
  removeNotificationById,
  clearNotifications,
} = notificationSlice.actions;
export default notificationSlice.reducer;
