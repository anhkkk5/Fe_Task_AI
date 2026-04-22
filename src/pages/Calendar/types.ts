import dayjs from "dayjs";

export interface GuestWithAvatar {
  email: string;
  name?: string;
  avatar?: string;
}

export interface CalendarSessionTaskItem {
  title: string;
  minutes: number;
  description?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  aiScheduled?: boolean;
  reason?: string;
  scheduleId?: string;
  sessionId?: string;
  sessionTasks?: CalendarSessionTaskItem[];
  originalStart?: dayjs.Dayjs;
  originalEnd?: dayjs.Dayjs;
}
