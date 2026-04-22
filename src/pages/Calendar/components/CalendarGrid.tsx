import React, { useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Tooltip } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { CalendarEvent } from "../types";

export const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return [
    { hour, minute: 0, label: `${hour.toString().padStart(2, "0")}:00` },
    { hour, minute: 30, label: `${hour.toString().padStart(2, "0")}:30` },
  ];
}).flat();

interface CalendarGridProps {
  tasksLoading: boolean;
  events: CalendarEvent[];
  weekDays: dayjs.Dayjs[];
  onGridClick: (
    day: dayjs.Dayjs,
    clientY: number,
    columnEl: HTMLElement,
  ) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove: (
    event: CalendarEvent,
    nextStart: dayjs.Dayjs,
    nextEnd: dayjs.Dayjs,
  ) => void | Promise<void>;
  onMoveBlocked?: (event: CalendarEvent, reason: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tasksLoading,
  events,
  weekDays,
  onGridClick,
  onEventClick,
  onEventMove,
  onMoveBlocked,
}) => {
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);

  const eventById = useMemo(
    () => new Map(events.map((e) => [e.id, e] as const)),
    [events],
  );

  // Stats calculations
  const weekTasks = events.filter(
    (e) =>
      e.start.isAfter(weekDays[0].startOf("day")) &&
      e.start.isBefore(weekDays[6].endOf("day")),
  );
  const totalTasks = weekTasks.length;
  const highPriorityTasks = weekTasks.filter(
    (e) => e.priority === "high" || e.priority === "urgent",
  ).length;
  const aiAssistedTasks = weekTasks.filter((e) => e.aiScheduled).length;
  const completedTasks = weekTasks.filter(
    (e) => e.status === "completed" || e.status === "done",
  ).length;

  const isEventInDay = (event: CalendarEvent, day: dayjs.Dayjs) => {
    return (
      event.start.isSame(day, "day") ||
      (event.start.isBefore(day, "day") && event.end.isAfter(day, "day"))
    );
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.hour();
    const startMinute = event.start.minute();
    const top = startHour * 48 + Math.round(startMinute * 0.8);
    const duration = event.end.diff(event.start, "minute");
    const height = Math.max(duration * 0.8, 24);
    return { top, height };
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: "#52c41a",
      medium: "#faad14",
      high: "#f5222d",
      urgent: "#722ed1",
    };
    return map[priority] || "#1890ff";
  };

  const getOverlappingEvents = (
    eventsList: CalendarEvent[],
    day: dayjs.Dayjs,
  ) => {
    const dayEvents = eventsList.filter((e) => isEventInDay(e, day));
    dayEvents.sort((a, b) => a.start.valueOf() - b.start.valueOf());
    const groups: CalendarEvent[][] = [];
    dayEvents.forEach((event) => {
      let added = false;
      for (const group of groups) {
        if (
          group.some(
            (e) => event.start.isBefore(e.end) && event.end.isAfter(e.start),
          )
        ) {
          group.push(event);
          added = true;
          break;
        }
      }
      if (!added) groups.push([event]);
    });
    const eventPositions = new Map<string, { width: number; left: number }>();
    groups.forEach((group) => {
      const width = 100 / group.length;
      group.forEach((event, index) => {
        eventPositions.set(event.id, {
          width: width - 2,
          left: index * width + 1,
        });
      });
    });
    return eventPositions;
  };

  const isMovableEvent = (event: CalendarEvent) => event.start.isAfter(dayjs());

  const snapMinutes = (minutes: number, step: number) =>
    Math.round(minutes / step) * step;

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const buildDroppedTime = (
    day: dayjs.Dayjs,
    clientY: number,
    columnEl: HTMLElement,
    durationMinutes: number,
  ) => {
    const rect = columnEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const rawMinutes = y / 0.8;
    const startMinutes = clamp(
      snapMinutes(rawMinutes, 30),
      0,
      24 * 60 - Math.max(30, durationMinutes),
    );
    const nextStart = day
      .clone()
      .hour(Math.floor(startMinutes / 60))
      .minute(startMinutes % 60)
      .second(0)
      .millisecond(0);
    const nextEnd = nextStart.clone().add(durationMinutes, "minute");
    return { nextStart, nextEnd };
  };

  return (
    <section className="calendar-content">
      <Row gutter={16} className="calendar-stats">
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Công việc"
              value={totalTasks}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Ưu tiên cao"
              value={highPriorityTasks}
              valueStyle={{ color: "#f5222d" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="AI"
              value={aiAssistedTasks}
              valueStyle={{ color: "#722ed1" }}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đã hoàn thành"
              value={completedTasks}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="calendar-card" loading={tasksLoading}>
        <div className="calendar-days-header">
          <div className="time-column-header">GMT+07</div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`day-header ${day.isSame(dayjs(), "day") ? "today" : ""}`}
            >
              <div className="day-name">{WEEK_DAYS[index]}</div>
              <div className="day-number">{day.format("DD")}</div>
            </div>
          ))}
        </div>

        <div className="calendar-time-grid">
          <div className="time-labels">
            {HOURS.filter((_, i) => i % 2 === 0).map((slot, i) => (
              <div key={i} className="time-label" style={{ top: i * 48 }}>
                {slot.label}
              </div>
            ))}
          </div>

          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`day-column ${day.isSame(dayjs(), "day") ? "today" : ""}`}
              onDragOver={(e) => {
                if (!draggingEventId) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!draggingEventId) return;
                e.preventDefault();
                e.stopPropagation();

                const event = eventById.get(draggingEventId);
                setDraggingEventId(null);
                if (!event) return;
                if (!isMovableEvent(event)) {
                  onMoveBlocked?.(
                    event,
                    "Chỉ được di chuyển phiên chưa đến giờ thực hiện.",
                  );
                  return;
                }

                const duration = Math.max(
                  30,
                  event.end.diff(event.start, "minute"),
                );
                const { nextStart, nextEnd } = buildDroppedTime(
                  day,
                  e.clientY,
                  e.currentTarget as HTMLElement,
                  duration,
                );
                onEventMove(event, nextStart, nextEnd);
              }}
              onClick={(e) =>
                onGridClick(day, e.clientY, e.currentTarget as HTMLElement)
              }
            >
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="hour-cell" />
              ))}
              {(() => {
                const positions = getOverlappingEvents(events, day);
                return events
                  .filter((e) => isEventInDay(e, day))
                  .map((event) => {
                    const { top, height } = getEventPosition(event);
                    const pos = positions.get(event.id) || {
                      width: 98,
                      left: 1,
                    };
                    return (
                      <Tooltip
                        key={event.id}
                        title={
                          <div>
                            <strong>{event.title}</strong>
                            <br />
                            {event.start.format("HH:mm")} -{" "}
                            {event.end.format("HH:mm")}
                            {event.reason && (
                              <>
                                <br />
                                <em>{event.reason}</em>
                              </>
                            )}
                          </div>
                        }
                      >
                        <div
                          className={`calendar-event priority-${event.priority} ${event.aiScheduled ? "ai-event" : ""}`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 30)}px`,
                            width: `${pos.width}%`,
                            left: `${pos.left}%`,
                            backgroundColor: getPriorityColor(event.priority),
                            opacity:
                              event.status === "completed" ||
                              event.status === "done"
                                ? 0.6
                                : 1,
                            cursor: isMovableEvent(event)
                              ? "grab"
                              : "not-allowed",
                          }}
                          draggable={isMovableEvent(event)}
                          onDragStart={(e) => {
                            if (!isMovableEvent(event)) {
                              e.preventDefault();
                              onMoveBlocked?.(
                                event,
                                "Không thể di chuyển phiên đã tới giờ hoặc đã qua.",
                              );
                              return;
                            }
                            setDraggingEventId(event.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", event.id);
                          }}
                          onDragEnd={() => setDraggingEventId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <div className="event-title">{event.title}</div>
                          <div className="event-time">
                            {event.start.format("HH:mm")} -{" "}
                            {event.end.format("HH:mm")}
                          </div>
                          {event.aiScheduled && (
                            <RobotOutlined className="event-ai-icon" />
                          )}
                        </div>
                      </Tooltip>
                    );
                  });
              })()}
              {day.isSame(dayjs(), "day") && (
                <div
                  className="current-time-line"
                  style={{
                    top: `${dayjs().hour() * 48 + Math.round(dayjs().minute() * 0.8)}px`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};
