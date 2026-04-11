import { useState, useMemo, useEffect } from "react";
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
  TimePicker,
  Input,
  Spin,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
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
  deleteAISession,
  type AIScheduleResponse,
} from "../../services/aiServices";
import "./Calendar.scss";

const { Text } = Typography;
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
  const {
    tasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    loading: tasksLoading,
  } = useTasks();
  const { aiSchedule: activeSchedule, fetchAISchedule } = useAISchedule();
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<AIScheduleResponse | null>(null);
  const [aiApplying, setAiApplying] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week");
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(dayjs());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [savingEventTime, setSavingEventTime] = useState(false);
  const [editEventStart, setEditEventStart] = useState<dayjs.Dayjs | null>(
    null,
  );
  const [editEventEnd, setEditEventEnd] = useState<dayjs.Dayjs | null>(null);
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createStart, setCreateStart] = useState<dayjs.Dayjs | null>(null);
  const [createEnd, setCreateEnd] = useState<dayjs.Dayjs | null>(null);

  const weekDays = useMemo(() => {
    const startOfWeek = currentWeek.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  }, [currentWeek]);

  const miniCalendarDays = useMemo(() => {
    const startOfMonth = miniCalendarMonth.startOf("month");
    const endOfMonth = miniCalendarMonth.endOf("month");
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const days: dayjs.Dayjs[] = [];
    // Previous month days
    for (let i = startDay; i > 0; i--) {
      days.push(startOfMonth.subtract(i, "day"));
    }
    // Current month days
    for (let i = 0; i < daysInMonth; i++) {
      days.push(startOfMonth.add(i, "day"));
    }
    // Next month days to fill 6 rows (42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(endOfMonth.add(i, "day"));
    }
    return days;
  }, [miniCalendarMonth]);

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

    // Identify parent tasks that have subtasks (to avoid showing both parent and subtasks)
    const taskIdsWithParent = new Set<string>();
    tasks.forEach((t: any) => {
      if (t?.parentTaskId) {
        taskIdsWithParent.add(String(t.parentTaskId));
      }
    });

    const taskEvents = tasks
      .filter((t: any) => t?.scheduledTime?.start && t?.scheduledTime?.end)
      // Skip parent tasks that have subtasks (show only subtasks to avoid duplicates)
      .filter((t: any) => {
        const taskId = String(t._id || t.id);
        // If this task has subtasks, skip it (let subtasks be shown instead)
        if (taskIdsWithParent.has(taskId)) return false;
        // Lọc bỏ các subtask do AI tự sinh ra (để tránh hiển thị trùng lặp với aiEvents từ activeSchedule)
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

    // Convert AI schedule sessions to events
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
            const startHour = parseInt(timeMatch[1], 10);
            const startMinute = parseInt(timeMatch[2], 10);
            const endHour = parseInt(timeMatch[3], 10);
            const endMinute = parseInt(timeMatch[4], 10);

            let start = date.hour(startHour).minute(startMinute);
            let end = date.hour(endHour).minute(endMinute);

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

  const openEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditEventStart(event.start);
    setEditEventEnd(event.end);
    setEventModalOpen(true);
  };

  const openCreateTaskModalFromClick = (
    day: dayjs.Dayjs,
    clientY: number,
    columnEl: HTMLElement,
  ) => {
    const rect = columnEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const rawMinutes = y / 0.8;
    const startMinutes = clamp(snapMinutes(rawMinutes, 30), 0, 24 * 60 - 30);

    const start = day
      .clone()
      .hour(Math.floor(startMinutes / 60))
      .minute(startMinutes % 60)
      .second(0)
      .millisecond(0);

    const endMinutes = clamp(startMinutes + 60, 0, 24 * 60);
    const end = day
      .clone()
      .hour(Math.floor(endMinutes / 60))
      .minute(endMinutes % 60)
      .second(0)
      .millisecond(0);

    setCreateTitle("");
    setCreateStart(start);
    setCreateEnd(end);
    setCreateModalOpen(true);
  };

  const handleCreateTaskFromCalendar = async () => {
    if (!createStart || !createEnd) {
      message.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }
    const title = createTitle.trim();
    if (!title) {
      message.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!createEnd.isAfter(createStart)) {
      message.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setCreatingTask(true);
    try {
      const ok = await handleCreate({
        title,
        status: "scheduled",
        priority: "medium",
        scheduledTime: {
          start: createStart.toISOString(),
          end: createEnd.toISOString(),
          aiPlanned: false,
          reason: "Người dùng tạo từ lịch",
        },
      });
      if (!ok) return;
      setCreateModalOpen(false);
      setCreateTitle("");
      setCreateStart(null);
      setCreateEnd(null);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSaveSelectedEventTime = async () => {
    if (!selectedEvent) return;
    if (!editEventStart || !editEventEnd) {
      message.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }

    const start = selectedEvent.start
      .clone()
      .hour(editEventStart.hour())
      .minute(editEventStart.minute())
      .second(0);
    const end = selectedEvent.end
      .clone()
      .hour(editEventEnd.hour())
      .minute(editEventEnd.minute())
      .second(0);

    if (!end.isAfter(start)) {
      message.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setSavingEventTime(true);
    try {
      if (
        selectedEvent.aiScheduled &&
        selectedEvent.scheduleId &&
        selectedEvent.sessionId
      ) {
        const newTime = `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
        await updateAISessionTime(
          selectedEvent.scheduleId,
          selectedEvent.sessionId,
          newTime,
        );
        await fetchAISchedule();
      } else {
        const ok = await handleUpdate(selectedEvent.id, {
          scheduledTime: {
            start: start.toISOString(),
            end: end.toISOString(),
            aiPlanned: false,
            reason: "Người dùng chỉnh sửa thời gian",
          },
          status: "scheduled",
        });
        if (!ok) return;
      }

      message.success("Đã cập nhật thời gian");
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              start,
              end,
            }
          : prev,
      );
      setEditEventStart(start);
      setEditEventEnd(end);
    } catch (error: any) {
      message.error(error?.message || "Không thể cập nhật thời gian");
    } finally {
      setSavingEventTime(false);
    }
  };

  const handleDeleteSelectedEvent = async () => {
    if (!selectedEvent) return;
    setDeletingEvent(true);
    try {
      if (selectedEvent.aiScheduled) {
        // AI event can be either:
        // - a suggestion session from AISchedule (has scheduleId + sessionId)
        // - a real Task that was applied by AI (scheduledTime.aiPlanned=true) -> should be deletable like normal tasks
        if (selectedEvent.scheduleId && selectedEvent.sessionId) {
          setHiddenEventIds((prev) => {
            const next = new Set(prev);
            next.add(selectedEvent.id);
            return next;
          });

          await deleteAISession(
            selectedEvent.scheduleId,
            selectedEvent.sessionId,
          );
          await fetchAISchedule();
          message.success("Đã xóa sự kiện khỏi lịch");
        } else {
          const ok = await handleDelete(selectedEvent.id);
          if (ok) message.success("Đã xóa công việc");
        }
      } else {
        const ok = await handleDelete(selectedEvent.id);
        if (ok) message.success("Đã xóa công việc");
      }
      setEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error: any) {
      setHiddenEventIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedEvent.id);
        return next;
      });
      message.error(error?.message || "Không thể xóa sự kiện");
    } finally {
      setDeletingEvent(false);
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
    const top = startHour * 48 + Math.round(startMinute * 0.8); // 48px per hour
    const duration = event.end.diff(event.start, "minute");
    const height = Math.max(duration * 0.8, 24); // scale minutes to pixels
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

  // Mini Calendar component - Google Calendar style
  const renderMiniCalendar = () => {
    const startOfMonth = currentWeek.startOf("month");
    const endOfMonth = currentWeek.endOf("month");
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    const calendarDays: dayjs.Dayjs[] = [];
    for (let i = startDay; i > 0; i--) {
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
      <div className="mini-calendar">
        <div className="mini-calendar-header">
          <span className="mini-calendar-month">
            {currentWeek.format("MMMM YYYY")}
          </span>
          <div className="mini-calendar-nav">
            <button
              onClick={() => setCurrentWeek(currentWeek.subtract(1, "month"))}
            >
              <LeftOutlined style={{ fontSize: 12 }} />
            </button>
            <button onClick={() => setCurrentWeek(currentWeek.add(1, "month"))}>
              <RightOutlined style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>
        <div className="mini-calendar-weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="weekday-label">
              {label}
            </div>
          ))}
        </div>
        <div className="mini-calendar-grid">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.month() === currentWeek.month();
            const isToday = day.isSame(dayjs(), "day");
            const isSelected = day.isSame(currentWeek, "day");
            const dayEvents = events.filter((e) => e.start.isSame(day, "day"));
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={index}
                className={`mini-calendar-day ${
                  !isCurrentMonth ? "other-month" : ""
                } ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${
                  hasEvents ? "has-events" : ""
                }`}
                onClick={() => {
                  setCurrentWeek(day);
                }}
              >
                {day.date()}
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
          <div className="header-left" style={{ minWidth: 200 }}>
            {/* Empty left section for balance */}
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
            {/* Nút Tạo giống Google Calendar */}
            <button
              className="sidebar-create-btn"
              onClick={() => navigate("/tasks")}
            >
              <PlusOutlined /> Tạo
            </button>

            {/* Mini Calendar */}
            <div className="mini-calendar">
              <div className="mini-calendar-header">
                <span className="mini-calendar-month">
                  {miniCalendarMonth.format("MMMM YYYY")}
                </span>
                <div className="mini-calendar-nav">
                  <button
                    onClick={() =>
                      setMiniCalendarMonth((m) => m.subtract(1, "month"))
                    }
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    onClick={() =>
                      setMiniCalendarMonth((m) => m.add(1, "month"))
                    }
                  >
                    <RightOutlined />
                  </button>
                </div>
              </div>
              <div className="mini-calendar-weekdays">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                  <div key={d} className="weekday-label">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mini-calendar-grid">
                {miniCalendarDays.map((day, idx) => {
                  const isCurrentMonth =
                    day.month() === miniCalendarMonth.month();
                  const isToday = day.isSame(dayjs(), "day");
                  const isSelected =
                    day.isSame(currentWeek, "week") && day.day() === 0;
                  const hasEvent = events.some((e) =>
                    e.start.isSame(day, "day"),
                  );

                  return (
                    <div
                      key={idx}
                      className={`mini-calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${hasEvent ? "has-events" : ""}`}
                      onClick={() => setCurrentWeek(day.startOf("week"))}
                    >
                      {day.date()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lịch của tôi - My Calendars section like Google Calendar */}
            <div className="sidebar-section" style={{ marginTop: 16 }}>
              <div className="sidebar-section-header">
                <span className="section-title">Lịch của tôi</span>
                <span className="section-toggle">▾</span>
              </div>
              <div className="sidebar-section-content">
                <div className="calendar-list-item">
                  <div
                    className="calendar-checkbox checked"
                    style={{ backgroundColor: "#1a73e8" }}
                  />
                  <span className="calendar-name">Công việc</span>
                </div>
                <div className="calendar-list-item">
                  <div
                    className="calendar-checkbox checked"
                    style={{ backgroundColor: "#fbbc04" }}
                  />
                  <span className="calendar-name">Tasks</span>
                </div>
                <div className="calendar-list-item">
                  <div
                    className="calendar-checkbox checked"
                    style={{ backgroundColor: "#34a853" }}
                  />
                  <span className="calendar-name">Sinh nhật</span>
                </div>
              </div>
            </div>

            {/* Lịch khác - Other Calendars section */}
            <div className="sidebar-section" style={{ marginTop: 8 }}>
              <div className="sidebar-section-header">
                <span className="section-title">Lịch khác</span>
                <span className="section-toggle">▾</span>
              </div>
              <div className="sidebar-section-content">
                <div className="calendar-list-item">
                  <div
                    className="calendar-checkbox checked"
                    style={{ backgroundColor: "#9aa0a6" }}
                  />
                  <span className="calendar-name">Ngày lễ ở Việt Nam</span>
                </div>
              </div>
            </div>
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
              <>
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
                      <div
                        key={i}
                        className="time-label"
                        style={{ top: i * 48 }}
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`day-column ${day.isSame(dayjs(), "day") ? "today" : ""}`}
                      onClick={(e) => {
                        if (
                          eventModalOpen ||
                          scheduleModalOpen ||
                          createModalOpen
                        )
                          return;
                        openCreateTaskModalFromClick(
                          day,
                          e.clientY,
                          e.currentTarget as HTMLElement,
                        );
                      }}
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
                                    cursor: "pointer",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEventModal(event);
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
              </>
            </Card>

            <Modal
              open={eventModalOpen}
              onCancel={() => {
                setEventModalOpen(false);
                setSelectedEvent(null);
                setEditEventStart(null);
                setEditEventEnd(null);
              }}
              title={selectedEvent?.title || "Sự kiện"}
              footer={
                <Space>
                  {selectedEvent && !selectedEvent.aiScheduled && (
                    <Button
                      onClick={() => {
                        setEventModalOpen(false);
                        navigate(`/tasks?task=${selectedEvent.id}`);
                      }}
                    >
                      Mở task
                    </Button>
                  )}
                  <Button
                    type="primary"
                    loading={savingEventTime}
                    onClick={handleSaveSelectedEventTime}
                  >
                    Lưu thời gian
                  </Button>
                  <Button
                    danger
                    loading={deletingEvent}
                    onClick={handleDeleteSelectedEvent}
                  >
                    Xóa
                  </Button>
                  <Button
                    onClick={() => {
                      setEventModalOpen(false);
                      setSelectedEvent(null);
                      setEditEventStart(null);
                      setEditEventEnd(null);
                    }}
                  >
                    Đóng
                  </Button>
                </Space>
              }
            >
              {selectedEvent && (
                <div>
                  <div>
                    <strong>Thời gian:</strong>{" "}
                    {selectedEvent.start.format("HH:mm")} -{" "}
                    {selectedEvent.end.format("HH:mm")}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          Bắt đầu
                        </div>
                        <TimePicker
                          value={editEventStart}
                          onChange={(v) => setEditEventStart(v)}
                          format="HH:mm"
                          minuteStep={5}
                          allowClear={false}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          Kết thúc
                        </div>
                        <TimePicker
                          value={editEventEnd}
                          onChange={(v) => setEditEventEnd(v)}
                          format="HH:mm"
                          minuteStep={5}
                          allowClear={false}
                        />
                      </div>
                    </Space>
                  </div>
                  {selectedEvent.reason && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Lý do:</strong> {selectedEvent.reason}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <strong>Nguồn:</strong>{" "}
                    {selectedEvent.aiScheduled ? "AI" : "Task"}
                  </div>
                </div>
              )}
            </Modal>

            <Modal
              open={createModalOpen}
              onCancel={() => {
                setCreateModalOpen(false);
                setCreateTitle("");
                setCreateStart(null);
                setCreateEnd(null);
              }}
              title="Tạo công việc"
              footer={
                <Space>
                  <Button
                    onClick={() => {
                      setCreateModalOpen(false);
                      setCreateTitle("");
                      setCreateStart(null);
                      setCreateEnd(null);
                    }}
                  >
                    Đóng
                  </Button>
                  <Button
                    type="primary"
                    loading={creatingTask}
                    onClick={handleCreateTaskFromCalendar}
                  >
                    Lưu
                  </Button>
                </Space>
              }
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Tiêu đề
                  </div>
                  <Input
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Nhập tiêu đề"
                    autoFocus
                  />
                </div>
                <Space>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Bắt đầu
                    </div>
                    <TimePicker
                      value={createStart}
                      onChange={(v) => {
                        if (!createStart || !v) return;
                        const next = createStart
                          .clone()
                          .hour(v.hour())
                          .minute(v.minute())
                          .second(0)
                          .millisecond(0);
                        setCreateStart(next);
                      }}
                      format="HH:mm"
                      minuteStep={5}
                      allowClear={false}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Kết thúc
                    </div>
                    <TimePicker
                      value={createEnd}
                      onChange={(v) => {
                        if (!createEnd || !v) return;
                        const next = createEnd
                          .clone()
                          .hour(v.hour())
                          .minute(v.minute())
                          .second(0)
                          .millisecond(0);
                        setCreateEnd(next);
                      }}
                      format="HH:mm"
                      minuteStep={5}
                      allowClear={false}
                    />
                  </div>
                </Space>
              </div>
            </Modal>
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
