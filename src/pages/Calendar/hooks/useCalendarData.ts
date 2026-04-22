import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { CalendarEvent, CalendarSessionTaskItem } from "../types";

const parseSuggestedDuration = (suggestedTime?: string): number => {
  if (!suggestedTime) return 60;
  const match = suggestedTime.match(
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
  );
  if (!match) return 60;

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = Number(match[3]) * 60 + Number(match[4]);
  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff : 60;
};

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

        const isLegacyTeamAutoSlot =
          !!t.teamAssignment &&
          !t.scheduledTime?.aiPlanned &&
          String(t.scheduledTime?.reason || "").toLowerCase() ===
            "team task start time";
        if (isLegacyTeamAutoSlot) return false;

        return true;
      })
      .map((t: any) => {
        const start = dayjs(t.scheduledTime.start);
        const end = dayjs(t.scheduledTime.end);
        const durationMinutes = Math.max(1, end.diff(start, "minute"));
        return {
          id: t._id || t.id,
          title: t.title,
          start,
          end,
          priority: t.priority || "medium",
          status: t.status,
          aiScheduled: !!t?.scheduledTime?.aiPlanned,
          reason: t?.scheduledTime?.reason,
          sessionTasks: [
            {
              title: t.title,
              minutes: durationMinutes,
              description: t.description,
            },
          ],
        };
      });

    const tasksById = new Map<string, any>();
    tasks.forEach((t: any) => {
      tasksById.set(String(t._id || t.id), t);
    });

    const aiEvents: CalendarEvent[] = [];
    const aiSessionRefs: Array<{
      sessionKey: string;
      eventId: string;
      scheduleId?: string;
      taskId: string;
      title: string;
      priority: "low" | "medium" | "high" | "urgent";
      status: string;
      reason?: string;
      sessionId?: string;
      start: dayjs.Dayjs;
      end: dayjs.Dayjs;
      durationMinutes: number;
      existingSessionTasks: CalendarSessionTaskItem[];
    }> = [];

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
            const rawSessionTasks = Array.isArray((task as any).sessionTasks)
              ? ((task as any).sessionTasks as CalendarSessionTaskItem[])
              : [];
            const normalizedSessionTasks = rawSessionTasks
              .map((item) => ({
                title: String(item?.title || "").trim(),
                minutes: Math.max(1, Number(item?.minutes) || 0),
                description:
                  typeof item?.description === "string"
                    ? item.description
                    : undefined,
              }))
              .filter((item) => item.title);

            aiSessionRefs.push({
              sessionKey:
                task.sessionId ||
                `${day.date}_${task.taskId}_${task.suggestedTime}`,
              eventId,
              scheduleId,
              taskId: String(task.taskId),
              title: task.title,
              priority: ((task.priority as any) || "medium") as
                | "low"
                | "medium"
                | "high"
                | "urgent",
              status: task.status || "pending",
              reason: task.reason,
              sessionId: task.sessionId,
              start,
              end,
              durationMinutes: parseSuggestedDuration(task.suggestedTime),
              existingSessionTasks: normalizedSessionTasks,
            });
          }
        }
      }
    }

    const refsByTaskId = new Map<string, typeof aiSessionRefs>();
    aiSessionRefs.forEach((ref) => {
      const current = refsByTaskId.get(ref.taskId) || [];
      current.push(ref);
      refsByTaskId.set(ref.taskId, current);
    });

    const sessionItemsByKey: Record<string, CalendarSessionTaskItem[]> = {};

    refsByTaskId.forEach((refs, taskId) => {
      const sortedRefs = [...refs].sort(
        (a, b) => a.start.valueOf() - b.start.valueOf(),
      );
      const sourceTask = tasksById.get(taskId);
      const breakdown = Array.isArray(sourceTask?.aiBreakdown)
        ? sourceTask.aiBreakdown
        : [];

      if (!breakdown.length) return;

      let stepIndex = 0;
      let remainingStepMinutes = Math.max(
        1,
        Number(breakdown[0]?.estimatedDuration) || 30,
      );

      for (const session of sortedRefs) {
        let remainingSessionMinutes = Math.max(1, session.durationMinutes);
        const packedItems: CalendarSessionTaskItem[] = [];

        while (remainingSessionMinutes > 0 && stepIndex < breakdown.length) {
          const currentStep = breakdown[stepIndex];
          const assignedMinutes = Math.min(
            remainingSessionMinutes,
            remainingStepMinutes,
          );

          packedItems.push({
            title: currentStep.title,
            description: currentStep.description,
            minutes: assignedMinutes,
          });

          remainingSessionMinutes -= assignedMinutes;
          remainingStepMinutes -= assignedMinutes;

          if (remainingStepMinutes <= 0) {
            stepIndex += 1;
            remainingStepMinutes =
              stepIndex < breakdown.length
                ? Math.max(
                    1,
                    Number(breakdown[stepIndex]?.estimatedDuration) || 30,
                  )
                : 0;
          }
        }

        sessionItemsByKey[session.sessionKey] = packedItems;
      }

      if (stepIndex < breakdown.length && sortedRefs.length > 0) {
        const lastSessionKey = sortedRefs[sortedRefs.length - 1].sessionKey;
        const overflowItems = sessionItemsByKey[lastSessionKey] || [];

        while (stepIndex < breakdown.length) {
          const currentStep = breakdown[stepIndex];
          overflowItems.push({
            title: currentStep.title,
            description: currentStep.description,
            minutes: remainingStepMinutes,
          });
          stepIndex += 1;
          remainingStepMinutes =
            stepIndex < breakdown.length
              ? Math.max(
                  1,
                  Number(breakdown[stepIndex]?.estimatedDuration) || 30,
                )
              : 0;
        }

        sessionItemsByKey[lastSessionKey] = overflowItems;
      }
    });

    aiSessionRefs.forEach((ref) => {
      const packedSessionTasks = sessionItemsByKey[ref.sessionKey] || [];
      const sessionTasks =
        ref.existingSessionTasks.length > 0
          ? ref.existingSessionTasks
          : packedSessionTasks.length > 0
            ? packedSessionTasks
            : [{ title: ref.title, minutes: ref.durationMinutes }];

      aiEvents.push({
        id: ref.eventId,
        title: ref.title,
        start: ref.start,
        end: ref.end,
        priority: ref.priority,
        status: ref.status,
        aiScheduled: true,
        reason: ref.reason,
        scheduleId: ref.scheduleId,
        sessionId: ref.sessionId,
        sessionTasks,
      });
    });

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
