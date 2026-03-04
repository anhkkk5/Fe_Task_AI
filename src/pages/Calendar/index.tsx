import {
  useState,
  useMemo,
  useCallback,
  type DragEvent,
  useRef,
  useEffect,
} from "react";
import {
  Card,
  Typography,
  Button,
  Badge,
  Tag,
  Tooltip,
  Modal,
  Space,
  Select,
  List,
  Empty,
  Spin,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SyncOutlined,
  BulbOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useTasks } from "../../hooks/useTasks";
import { useAISchedule } from "../../hooks/useAISchedule";
import {
  aiSchedulePlan,
  saveAISchedule,
  deleteAISchedule,
  updateAISessionTime,
  type AIScheduleResponse,
} from "../../services/aiServices";
import "./Calendar.scss";

const { Title, Text } = Typography;
const { Option } = Select;

dayjs.locale("vi");

interface CalendarEvent {
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
  originalStart?: dayjs.Dayjs;
  originalEnd?: dayjs.Dayjs;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return [
    { hour, minute: 0, label: `${hour.toString().padStart(2, "0")}:00` },
    { hour, minute: 30, label: `${hour.toString().padStart(2, "0")}:30` },
  ];
}).flat();

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function Calendar() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, handleUpdate, fetchTasks } = useTasks();
  const { aiSchedule: activeSchedule, fetchAISchedule } = useAISchedule();
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<AIScheduleResponse | null>(null);
  const [aiApplying, setAiApplying] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week");
  const [draggingTask, setDraggingTask] = useState<{
    id: string;
    title: string;
    estimatedDuration?: number;
    isAISession?: boolean;
    scheduleId?: string;
    sessionId?: string;
  } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{
    eventId: string;
    scheduleId?: string;
    sessionId?: string;
    startY: number;
    originalEnd: dayjs.Dayjs;
    day: dayjs.Dayjs;
  } | null>(null);
  const [tempEvents, setTempEvents] = useState<
    Map<string, { start: dayjs.Dayjs; end: dayjs.Dayjs }>
  >(new Map());

  const weekDays = useMemo(() => {
    const startOfWeek = currentWeek.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  }, [currentWeek]);

  const events = useMemo<CalendarEvent[]>(() => {
    const taskEvents = tasks
      .filter((t: any) => t?.scheduledTime?.start && t?.scheduledTime?.end)
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

    // Convert AI schedule sessions to events
    const aiEvents: CalendarEvent[] = [];
    if (activeSchedule?.schedule) {
      for (const day of activeSchedule.schedule) {
        const date = dayjs(day.date);
        for (const task of day.tasks) {
          const timeMatch = task.suggestedTime.match(
            /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
          );
          if (timeMatch) {
            const startHour = parseInt(timeMatch[1], 10);
            const startMinute = parseInt(timeMatch[2], 10);
            const endHour = parseInt(timeMatch[3], 10);
            const endMinute = parseInt(timeMatch[4], 10);

            let start = date.hour(startHour).minute(startMinute);
            let end = date.hour(endHour).minute(endMinute);

            // Apply optimistic updates if any
            const eventId = task.sessionId || `${task.taskId}_${day.date}`;
            const tempUpdate = tempEvents.get(eventId);
            if (tempUpdate) {
              start = tempUpdate.start;
              end = tempUpdate.end;
            }

            aiEvents.push({
              id: eventId,
              title: task.title,
              start,
              end,
              priority: (task.priority as any) || "medium",
              status: task.status || "pending",
              aiScheduled: true,
              reason: task.reason,
              scheduleId: activeSchedule.id,
              sessionId: task.sessionId,
            });
          }
        }
      }
    }

    return [...taskEvents, ...aiEvents];
  }, [tasks, activeSchedule, tempEvents]);

  // Global resize handlers
  useEffect(() => {
    if (!resizingEvent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingEvent.startY;
      const deltaMinutes = Math.round(deltaY / 1); // 1px = 1 minute
      const newEnd = resizingEvent.originalEnd.add(deltaMinutes, "minute");

      // Optimistic update - update immediately without waiting for API
      setTempEvents((prev) => {
        const next = new Map(prev);
        const currentEvent = events.find(
          (ev) => ev.id === resizingEvent.eventId,
        );
        if (currentEvent) {
          next.set(resizingEvent.eventId, {
            start: currentEvent.start,
            end: newEnd,
          });
        }
        return next;
      });
    };

    const handleMouseUp = async () => {
      if (!resizingEvent.scheduleId || !resizingEvent.sessionId) {
        setResizingEvent(null);
        return;
      }

      const tempUpdate = tempEvents.get(resizingEvent.eventId);
      if (!tempUpdate) {
        setResizingEvent(null);
        return;
      }

      const newTime = `${tempUpdate.start.format("HH:mm")} - ${tempUpdate.end.format("HH:mm")}`;

      try {
        await updateAISessionTime(
          resizingEvent.scheduleId,
          resizingEvent.sessionId,
          newTime,
        );
        // Show toast with undo button
        const originalTime = `${resizingEvent.originalEnd.subtract(30, "minute").format("HH:mm")} - ${resizingEvent.originalEnd.format("HH:mm")}`;
        message.success({
          content: (
            <span>
              Đã cập nhật lịch cho sự kiện lúc {newTime}
              <Button
                type="link"
                size="small"
                style={{ marginLeft: 8 }}
                onClick={async () => {
                  // Undo action
                  await updateAISessionTime(
                    resizingEvent.scheduleId!,
                    resizingEvent.sessionId!,
                    originalTime,
                  );
                  await fetchAISchedule();
                  message.info("Đã hoàn tác thay đổi");
                }}
              >
                Hủy
              </Button>
            </span>
          ),
          duration: 5,
        });
        await fetchAISchedule(); // Sync with server
      } catch (error: any) {
        message.error(error?.message || "Không thể cập nhật thời gian");
        // Rollback optimistic update
        setTempEvents((prev) => {
          const next = new Map(prev);
          next.delete(resizingEvent.eventId);
          return next;
        });
      } finally {
        setResizingEvent(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingEvent, events, tempEvents, fetchAISchedule]);

  const handleDeleteAISchedule = async () => {
    if (!activeSchedule?.id) return;
    try {
      await deleteAISchedule(activeSchedule.id);
      message.success("Đã xóa lịch AI");
      fetchAISchedule(); // Refresh
    } catch (error: any) {
      message.error(error?.message || "Không thể xóa lịch AI");
    }
  };

  const applyAiSchedule = async () => {
    if (!aiSchedule) return;
    setAiApplying(true);
    try {
      const result = await saveAISchedule(aiSchedule);
      message.success(
        result.message || `Đã lưu lịch trình với ${result.totalSessions} phiên`,
      );
      await fetchAISchedule(); // Refresh AI schedule on calendar
      setScheduleModalOpen(false);
    } catch (error: any) {
      message.error(
        error?.message || "Không thể áp dụng lịch trình. Vui lòng thử lại!",
      );
    } finally {
      setAiApplying(false);
    }
  };

  const unscheduledTasks = useMemo(() => {
    return tasks.filter(
      (t: any) => !(t?.scheduledTime?.start && t?.scheduledTime?.end),
    );
  }, [tasks]);

  const snapMinutes = (minutes: number, step: number) => {
    return Math.round(minutes / step) * step;
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };

  const getDefaultDurationMinutes = (
    task: { estimatedDuration?: number } | null,
  ) => {
    const minutes = task?.estimatedDuration ?? 60;
    if (minutes <= 0) return 60;
    return Math.min(minutes, 240);
  };

  const handleDropOnDayColumn = async (
    e: DragEvent<HTMLDivElement>,
    day: dayjs.Dayjs,
  ) => {
    e.preventDefault();
    const rawId = e.dataTransfer.getData("text/task-id");
    const taskId = rawId || draggingTask?.id;
    if (!taskId) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Week view: 1px = 1 minute (because top = hour*60 + minute)
    const minutesFromStart = snapMinutes(y, 15);

    const workStart = 8 * 60;
    const lunchStart = 12 * 60;
    const lunchEnd = 13 * 60;
    const workEnd = 17 * 60;

    let startMinutes = clamp(minutesFromStart, workStart, workEnd - 15);

    // Avoid lunch break
    if (startMinutes >= lunchStart && startMinutes < lunchEnd) {
      startMinutes = lunchEnd;
    }

    const duration = getDefaultDurationMinutes(draggingTask);
    let endMinutes = startMinutes + duration;

    // Clamp to workEnd
    if (endMinutes > workEnd) {
      endMinutes = workEnd;
      startMinutes = Math.max(workStart, endMinutes - duration);
      // Re-avoid lunch if pushed back
      if (startMinutes >= lunchStart && startMinutes < lunchEnd) {
        startMinutes = lunchEnd;
      }
    }

    const start = day.startOf("day").add(startMinutes, "minute");
    const end = day.startOf("day").add(endMinutes, "minute");

    // Handle AI session drag-drop
    if (
      draggingTask?.isAISession &&
      draggingTask?.scheduleId &&
      draggingTask?.sessionId
    ) {
      const newTime = `${start.format("HH:mm")} - ${end.format("HH:mm")}`;

      // Find original time for undo
      const originalEvent = events.find((e) => e.id === draggingTask.id);
      const originalTime = originalEvent
        ? `${originalEvent.start.format("HH:mm")} - ${originalEvent.end.format("HH:mm")}`
        : null;

      try {
        await updateAISessionTime(
          draggingTask.scheduleId,
          draggingTask.sessionId,
          newTime,
        );
        // Show toast with undo button
        message.success({
          content: (
            <span>
              Đã cập nhật lịch cho sự kiện lúc {newTime}
              {originalTime && (
                <Button
                  type="link"
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={async () => {
                    await updateAISessionTime(
                      draggingTask.scheduleId!,
                      draggingTask.sessionId!,
                      originalTime,
                    );
                    await fetchAISchedule();
                    message.info("Đã hoàn tác thay đổi");
                  }}
                >
                  Hủy
                </Button>
              )}
            </span>
          ),
          duration: 5,
        });
        await fetchAISchedule(); // Refresh to show updated time
      } catch (error: any) {
        message.error(error?.message || "Không thể cập nhật thời gian");
      } finally {
        setDraggingTask(null);
      }
      return;
    }

    // Handle regular task drag-drop
    try {
      const ok = await handleUpdate(taskId, {
        scheduledTime: {
          start: start.toISOString(),
          end: end.toISOString(),
          aiPlanned: false,
          reason: "Người dùng kéo-thả để lên lịch",
        },
      });
      if (ok) {
        message.success("Đã lên lịch cho công việc");
      }
    } finally {
      setDraggingTask(null);
    }
  };

  const analyzeSchedule = async () => {
    const pendingTasks = tasks.filter(
      (t: any) => t.status !== "completed" && t.status !== "done",
    );
    if (pendingTasks.length === 0) {
      message.info("Khong co cong viec nao can len lich!");
      return;
    }

    setAiLoading(true);
    try {
      const taskIds = pendingTasks.slice(0, 10).map((t: any) => t._id || t.id);
      const result = await aiSchedulePlan({
        taskIds,
        startDate: currentWeek.format("YYYY-MM-DD"),
      });
      setAiSchedule(result);
      setScheduleModalOpen(true);
      message.success("AI da phan tich va tao lich toi uu!");
    } catch (error: any) {
      message.error(error?.message || "Khong the tao lich. Vui long thu lai!");
    } finally {
      setAiLoading(false);
    }
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.hour();
    const startMinute = event.start.minute();
    const top = startHour * 60 + startMinute;
    const duration = event.end.diff(event.start, "minute");
    const height = Math.max(duration, 30);
    return { top, height };
  };

  const isEventInDay = (event: CalendarEvent, day: dayjs.Dayjs) => {
    return (
      event.start.isSame(day, "day") ||
      (event.start.isBefore(day, "day") && event.end.isAfter(day, "day"))
    );
  };

  // Calculate overlapping events and their horizontal positions
  const getOverlappingEvents = (events: CalendarEvent[], day: dayjs.Dayjs) => {
    const dayEvents = events.filter((e) => isEventInDay(e, day));

    // Sort by start time
    dayEvents.sort((a, b) => a.start.valueOf() - b.start.valueOf());

    // Group overlapping events
    const groups: CalendarEvent[][] = [];

    dayEvents.forEach((event) => {
      let added = false;

      // Try to add to existing group
      for (const group of groups) {
        const overlaps = group.some(
          (e) => event.start.isBefore(e.end) && event.end.isAfter(e.start),
        );

        if (overlaps) {
          group.push(event);
          added = true;
          break;
        }
      }

      // Create new group if not added
      if (!added) {
        groups.push([event]);
      }
    });

    // Calculate position for each event
    const eventPositions = new Map<string, { width: number; left: number }>();

    groups.forEach((group) => {
      const count = group.length;
      const width = 100 / count;

      group.forEach((event, index) => {
        eventPositions.set(event.id, {
          width: width - 2, // 2% gap
          left: index * width + 1, // 1% margin
        });
      });
    });

    return eventPositions;
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

  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentWeek(currentWeek.subtract(1, "month"));
    } else if (viewMode === "week") {
      setCurrentWeek(currentWeek.subtract(1, "week"));
    } else {
      setCurrentWeek(currentWeek.subtract(1, "day"));
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentWeek(currentWeek.add(1, "month"));
    } else if (viewMode === "week") {
      setCurrentWeek(currentWeek.add(1, "week"));
    } else {
      setCurrentWeek(currentWeek.add(1, "day"));
    }
  };

  const goToToday = () => setCurrentWeek(dayjs());

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

  // Render month view
  const renderMonthView = () => {
    const startOfMonth = currentWeek.startOf("month");
    const endOfMonth = currentWeek.endOf("month");
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const calendarDays: dayjs.Dayjs[] = [];
    const prevMonthDays = startDay;
    for (let i = prevMonthDays; i > 0; i--) {
      calendarDays.push(startOfMonth.subtract(i, "day"));
    }
    for (let i = 0; i < daysInMonth; i++) {
      calendarDays.push(startOfMonth.add(i, "day"));
    }
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(endOfMonth.add(i, "day"));
    }

    return (
      <div className="calendar-month-view">
        <div className="month-header">
          {WEEK_DAYS.map((day, index) => (
            <div key={index} className="month-day-header">
              {day}
            </div>
          ))}
        </div>
        <div className="month-grid">
          {calendarDays.map((day, index) => {
            const dayEvents = events.filter((e) => isEventInDay(e, day));
            const isCurrentMonth = day.month() === currentWeek.month();
            const isToday = day.isSame(dayjs(), "day");

            return (
              <div
                key={index}
                className={`month-day-cell ${isCurrentMonth ? "current-month" : "other-month"} ${isToday ? "today" : ""}`}
                onClick={() => {
                  setCurrentWeek(day);
                  setViewMode("day");
                }}
              >
                <div className="month-day-number">{day.format("D")}</div>
                <div className="month-day-events">
                  {dayEvents.slice(0, 4).map((event, idx) => (
                    <div
                      key={idx}
                      className="month-event-bar"
                      style={{
                        backgroundColor: getPriorityColor(event.priority),
                      }}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="month-event-more">
                      +{dayEvents.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const day = currentWeek;
    const dayEvents = events.filter((e) => isEventInDay(e, day));

    return (
      <div className="calendar-day-view">
        <div className="day-view-header">
          <Text strong style={{ fontSize: 18 }}>
            {day.format("dddd, DD/MM/YYYY")}
          </Text>
        </div>
        <div className="day-view-timeline">
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourEvents = dayEvents.filter(
              (e) =>
                e.start.hour() === hour ||
                (e.start.hour() < hour && e.end.hour() > hour),
            );
            return (
              <div key={hour} className="day-view-hour">
                <div className="day-view-hour-label">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                <div className="day-view-hour-content">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="day-view-event"
                      style={{
                        backgroundColor: getPriorityColor(event.priority),
                      }}
                      onClick={() => navigate(`/tasks?task=${event.id}`)}
                    >
                      <span className="event-time">
                        {event.start.format("HH:mm")}
                      </span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <main className="calendar-main">
        <div className="calendar-header">
          <div className="header-left">
            <Link to="/" className="back-link">
              <ArrowLeftOutlined /> Dashboard
            </Link>
            <Title level={3} style={{ margin: 0 }}>
              <CalendarOutlined /> Lich cong viec AI
            </Title>
          </div>

          <div className="header-center">
            <Button icon={<LeftOutlined />} onClick={goToPrevious} />
            <Button onClick={goToToday}>Hôm nay</Button>
            <Button icon={<RightOutlined />} onClick={goToNext} />
            <Text strong style={{ fontSize: 16, marginLeft: 16 }}>
              {viewMode === "month"
                ? currentWeek.format("MM/YYYY")
                : viewMode === "day"
                  ? currentWeek.format("DD/MM/YYYY")
                  : `${weekDays[0].format("DD/MM")} - ${weekDays[6].format("DD/MM/YYYY")}`}
            </Text>
          </div>

          <div className="header-right">
            <Select
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 120 }}
            >
              <Option value="month">Tháng</Option>
              <Option value="week">Tuần</Option>
              <Option value="day">Ngày</Option>
            </Select>
            {activeSchedule?.id && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteAISchedule}
                style={{ marginRight: 8 }}
              >
                Xóa lịch AI
              </Button>
            )}
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={aiLoading}
              onClick={analyzeSchedule}
            >
              AI Tối ưu Lịch
            </Button>
          </div>
        </div>

        <div className="calendar-layout">
          <aside className="calendar-sidebar">
            <Card
              size="small"
              className="sidebar-card"
              title={currentWeek.format("MMMM YYYY")}
              extra={
                <Button type="link" size="small" onClick={goToToday}>
                  Hôm nay
                </Button>
              }
            >
              {renderMonthView()}
            </Card>

            <Card
              size="small"
              className="sidebar-card"
              title={`Chưa lên lịch (${unscheduledTasks.length})`}
              style={{ marginTop: 12 }}
            >
              {unscheduledTasks.length === 0 ? (
                <Text type="secondary">Tất cả công việc đã có lịch.</Text>
              ) : (
                <List
                  size="small"
                  dataSource={unscheduledTasks.slice(0, 8)}
                  renderItem={(t: any) => (
                    <List.Item
                      className="unscheduled-item"
                      draggable
                      onDragStart={(e) => {
                        const id = String(t._id || t.id || "");
                        e.dataTransfer.setData("text/task-id", id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingTask({
                          id,
                          title: String(t.title || ""),
                          estimatedDuration: t.estimatedDuration,
                        });
                      }}
                      onDragEnd={() => setDraggingTask(null)}
                      onClick={() => navigate(`/tasks?task=${t._id || t.id}`)}
                    >
                      <Space
                        direction="vertical"
                        size={0}
                        style={{ width: "100%" }}
                      >
                        <Text strong className="unscheduled-title">
                          {t.title}
                        </Text>
                        <Space size={6}>
                          <Tag color={getPriorityColor(t.priority || "medium")}>
                            {t.priority || "medium"}
                          </Tag>
                          {t.deadline && (
                            <Text
                              type="secondary"
                              className="unscheduled-deadline"
                            >
                              {dayjs(t.deadline).format("DD/MM")}
                            </Text>
                          )}
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </aside>

          <section className="calendar-content">
            <Row gutter={16} className="calendar-stats">
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Cong viec"
                    value={totalTasks}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Uu tien cao"
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
                    title="Da hoan thanh"
                    value={
                      weekTasks.filter(
                        (e) => e.status === "completed" || e.status === "done",
                      ).length
                    }
                    valueStyle={{ color: "#52c41a" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Card className="calendar-card" loading={tasksLoading}>
              {viewMode === "month" && renderMonthView()}
              {viewMode === "day" && renderDayView()}

              {viewMode === "week" && (
                <>
                  <div className="calendar-days-header">
                    <div className="time-column-header">Gio</div>
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
                        <div
                          key={i}
                          className="time-label"
                          style={{ top: i * 60 }}
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>

                    {weekDays.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`day-column ${day.isSame(dayjs(), "day") ? "today" : ""}`}
                        onDragOver={(e) => {
                          if (draggingTask) e.preventDefault();
                        }}
                        onDrop={(e) => handleDropOnDayColumn(e, day)}
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
                                      backgroundColor: getPriorityColor(
                                        event.priority,
                                      ),
                                      opacity:
                                        event.status === "completed" ||
                                        event.status === "done"
                                          ? 0.6
                                          : 1,
                                      cursor: event.aiScheduled
                                        ? "move"
                                        : "pointer",
                                    }}
                                    draggable={event.aiScheduled}
                                    onDragStart={(e) => {
                                      if (
                                        event.aiScheduled &&
                                        activeSchedule?.id
                                      ) {
                                        e.dataTransfer.setData(
                                          "text/task-id",
                                          event.id,
                                        );
                                        e.dataTransfer.effectAllowed = "move";
                                        setDraggingTask({
                                          id: event.id,
                                          title: event.title,
                                          estimatedDuration: event.end.diff(
                                            event.start,
                                            "minute",
                                          ),
                                          isAISession: true,
                                          scheduleId:
                                            event.scheduleId ||
                                            activeSchedule.id,
                                          sessionId:
                                            event.sessionId || event.id,
                                        });
                                      }
                                    }}
                                    onDragEnd={() => setDraggingTask(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/tasks?task=${event.id}`);
                                    }}
                                  >
                                    <div className="event-title">
                                      {event.title}
                                    </div>
                                    <div className="event-time">
                                      {event.start.format("HH:mm")} -{" "}
                                      {event.end.format("HH:mm")}
                                    </div>
                                    {event.aiScheduled && (
                                      <>
                                        <RobotOutlined className="event-ai-icon" />
                                        <div
                                          className="resize-handle"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setResizingEvent({
                                              eventId: event.id,
                                              scheduleId: event.scheduleId,
                                              sessionId: event.sessionId,
                                              startY: e.clientY,
                                              originalEnd: event.end,
                                              day: day,
                                            });
                                          }}
                                        />
                                      </>
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
                              top: `${dayjs().hour() * 60 + dayjs().minute()}px`,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </section>
        </div>

        {aiSchedule && (
          <Card
            className="ai-suggestions-panel"
            title={
              <>
                <BulbOutlined /> Goi y lich tu AI
              </>
            }
          >
            <Alert
              title={aiSchedule.personalizationNote}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div className="ai-schedule-preview">
              {aiSchedule.schedule.slice(0, 3).map((day, idx) => (
                <div key={idx} className="ai-day-preview">
                  <Text strong>
                    {day.day} ({day.date})
                  </Text>
                  <div className="ai-tasks-preview">
                    {day.tasks.slice(0, 3).map((task, tidx) => (
                      <Tag key={tidx} color="blue">
                        {task.suggestedTime}: {task.title}
                      </Tag>
                    ))}
                    {day.tasks.length > 3 && (
                      <Tag>+{day.tasks.length - 3} task khac</Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="primary"
              block
              icon={<SyncOutlined />}
              onClick={() => setScheduleModalOpen(true)}
            >
              Xem chi tiet lich AI
            </Button>
          </Card>
        )}

        {!tasksLoading && events.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>Chua co cong viec nao tren lich</Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/tasks")}
                >
                  Them cong viec
                </Button>
              </Space>
            }
          />
        )}
      </main>

      <Modal
        title={
          <Space>
            <RobotOutlined /> Lich trinh toi uu tu AI
          </Space>
        }
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setScheduleModalOpen(false)}>
            Dong
          </Button>,
          <Button
            key="apply"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={aiApplying}
            onClick={applyAiSchedule}
          >
            Ap dung lich trinh
          </Button>,
        ]}
      >
        {aiSchedule ? (
          <div className="ai-schedule-modal-content">
            <Alert
              title={`AI da phan tich ${aiSchedule.totalTasks} cong viec va tao lich trong ${aiSchedule.schedule.length} ngay`}
              message={aiSchedule.personalizationNote}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {aiSchedule.schedule.map((day, idx) => (
              <div key={idx} className="ai-day-card">
                <Divider>
                  <Badge count={idx + 1} color="#4a90e2" />
                  <Text strong style={{ marginLeft: 8 }}>
                    {day.day}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {day.date}
                  </Text>
                </Divider>
                <div className="ai-tasks-list">
                  {day.tasks.map((task, tidx) => (
                    <div key={tidx} className="ai-task-item">
                      <Tag color="blue">{task.suggestedTime}</Tag>
                      <Text strong>{task.title}</Text>
                      <Tag color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Tag>
                      <Tooltip title={task.reason}>
                        <BulbOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Spin tip="Dang tai..." />
        )}
      </Modal>
    </div>
  );
}

export default Calendar;
