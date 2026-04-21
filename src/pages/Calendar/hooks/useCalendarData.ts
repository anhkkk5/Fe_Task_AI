import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { CalendarEvent } from "../types";

export const useCalendarData = (tasks: any[], activeSchedule: any) => {
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());

  const events = useMemo<CalendarEvent[]>(() => {
    const aiTaskIdsInSchedule = new Set<string>();
    if (activeSchedule?.schedule) {
      for (const day of activeSchedule.schedule) {
        for (const task of day.tasks || []) {
          if (!task?.taskId) continue;
          aiTaskIdsInSchedule.add(String(task.taskId));
        }
      }
    }

    const taskIdsWithParent = new Set<string>();
    tasks.forEach((t: any) => {
      if (t?.parentTaskId) {
        taskIdsWithParent.add(String(t.parentTaskId));
      }
    });

    const taskEvents = tasks
      .filter((t: any) => t?.scheduledTime?.start && t?.scheduledTime?.end)
      .filter((t: any) => {
        const taskId = String(t._id || t.id);
        if (taskIdsWithParent.has(taskId)) return false;
        if (t.parentTaskId && t.scheduledTime?.aiPlanned) return false;
        return true;
      })
      .map((t: any) => {
        const start = dayjs(t.scheduledTime.start);
        const end = dayjs(t.scheduledTime.end);
        return {
          id: t._id || t.id,
          title: t.title,
          start,
          end,
          priority: t.priority || "medium",
          status: t.status,
          aiScheduled: !!t?.scheduledTime?.aiPlanned,
          reason: t?.scheduledTime?.reason,
        };
      });

    const aiEvents: CalendarEvent[] = [];
    if (activeSchedule?.schedule) {
      for (const day of activeSchedule.schedule) {
        const date = dayjs(day.date);
        for (const task of day.tasks) {
          if (String(task.status ?? "") === "skipped") continue;
          const timeMatch = task.suggestedTime.match(
            /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
          );
          if (timeMatch) {
            const start = date
              .hour(parseInt(timeMatch[1], 10))
              .minute(parseInt(timeMatch[2], 10));
            const end = date
              .hour(parseInt(timeMatch[3], 10))
              .minute(parseInt(timeMatch[4], 10));
            const eventId = task.sessionId || `${task.taskId}_${day.date}`;
            const scheduleId =
              (task as any).scheduleId ||
              (activeSchedule as any)?.id ||
              (activeSchedule as any)?._id;

            aiEvents.push({
              id: eventId,
              title: task.title,
              start,
              end,
              priority: (task.priority as any) || "medium",
              status: task.status || "pending",
              aiScheduled: true,
              reason: task.reason,
              scheduleId,
              sessionId: task.sessionId,
            });
          }
        }
      }
    }

    return [...taskEvents, ...aiEvents].filter(
      (e) => !hiddenEventIds.has(e.id),
    );
  }, [tasks, activeSchedule, hiddenEventIds]);

  const hideEvent = (id: string) => {
    setHiddenEventIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const unhideEvent = (id: string) => {
    setHiddenEventIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return { events, hiddenEventIds, hideEvent, unhideEvent };
};
