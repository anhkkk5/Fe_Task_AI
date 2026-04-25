import { useState, useMemo, useEffect } from "react";
import { Typography, Button, Select, message } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
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
} from "../../services/aiServices";
import type { AIScheduleResponse } from "../../services/aiServices";
import {
  getGoogleStatus,
  redirectToGoogleAuth,
} from "../../services/backendGoogleServices";
import type { GoogleUserInfo } from "../../services/backendGoogleServices";
import type { CalendarEvent } from "./types";
import { useCalendarData } from "./hooks/useCalendarData";

// Components
import { CalendarSidebar } from "./components/CalendarSidebar";
import { CalendarGrid } from "./components/CalendarGrid";
import { CreateEventModal } from "./components/CreateEventModal";
import { EventDetailModal } from "./components/EventDetailModal";
import { AvailabilitySettingsModal } from "./components/AvailabilitySettingsModal";
import {
  AISuggestionsPanel,
  AIScheduleModal,
} from "./components/AIScheduleModals";

import "./Calendar.scss";

const { Text } = Typography;
const { Option } = Select;
dayjs.locale("vi");

function Calendar() {
  const {
    tasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    loading: tasksLoading,
  } = useTasks();
  const { aiSchedule: activeSchedule, fetchAISchedule } = useAISchedule();

  // Core View State
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week");
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(dayjs());

  // Google Integration State
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Modals & Forms State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStart, setCreateStart] = useState<dayjs.Dayjs | null>(null);
  const [createEnd, setCreateEnd] = useState<dayjs.Dayjs | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // AI Schedule states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplying, setAiApplying] = useState(false);
  const [aiScheduleLocal, setAiScheduleLocal] =
    useState<AIScheduleResponse | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

  // Custom data hook to process all events and AI tasks
  const { events, hideEvent, unhideEvent } = useCalendarData(
    tasks,
    activeSchedule,
  );

  const weekDays = useMemo(() => {
    const startOfWeek = currentWeek.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  }, [currentWeek]);

  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const status = await getGoogleStatus();
        if (status.connected && status.user) {
          setGoogleUser({
            id: status.user.userId,
            email: status.user.email,
            name: status.user.name,
            picture: status.user.picture,
          });
        }
      } catch (err) {
        console.error("Failed to check Google status:", err);
      }
    };
    checkGoogleStatus();
  }, []);

  useEffect(() => {
    const handler = () => fetchAISchedule();
    window.addEventListener("task-deleted", handler);
    return () => window.removeEventListener("task-deleted", handler);
  }, [fetchAISchedule]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    redirectToGoogleAuth();
  };

  const handleGoogleSignOut = () => {
    setGoogleUser(null);
  };

  // Navigations
  const goToPrevious = () => {
    if (viewMode === "month") setCurrentWeek(currentWeek.subtract(1, "month"));
    else if (viewMode === "week")
      setCurrentWeek(currentWeek.subtract(1, "week"));
    else setCurrentWeek(currentWeek.subtract(1, "day"));
  };

  const goToNext = () => {
    if (viewMode === "month") setCurrentWeek(currentWeek.add(1, "month"));
    else if (viewMode === "week") setCurrentWeek(currentWeek.add(1, "week"));
    else setCurrentWeek(currentWeek.add(1, "day"));
  };

  const goToToday = () => setCurrentWeek(dayjs());

  // Grid Interactions
  const snapMinutes = (minutes: number, step: number) =>
    Math.round(minutes / step) * step;
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const openCreateTaskModalFromClick = (
    day: dayjs.Dayjs,
    clientY: number,
    columnEl: HTMLElement,
  ) => {
    const rect = columnEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const rawMinutes = y / 0.8; // 48px per hour = 0.8px per minute
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
    setCreateStart(start);
    setCreateEnd(end);
    setCreateModalOpen(true);
  };

  const openEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const handleEventMove = async (
    event: CalendarEvent,
    nextStart: dayjs.Dayjs,
    nextEnd: dayjs.Dayjs,
  ) => {
    const now = dayjs();

    if (!event.start.isAfter(now)) {
      message.warning("Chỉ có thể di chuyển phiên chưa tới giờ thực hiện.");
      return;
    }

    if (nextStart.isBefore(now)) {
      message.warning("Không thể di chuyển phiên về thời gian trong quá khứ.");
      return;
    }

    try {
      if (event.aiScheduled && event.scheduleId && event.sessionId) {
        const newTime = `${nextStart.format("HH:mm")} - ${nextEnd.format("HH:mm")}`;
        const targetDate = nextStart.format("YYYY-MM-DD");
        await updateAISessionTime(
          event.scheduleId,
          event.sessionId,
          newTime,
          targetDate,
        );
        await fetchAISchedule();
        message.success("Đã di chuyển phiên lịch AI");
        return;
      }

      const ok = await handleUpdate(event.id, {
        scheduledTime: {
          start: nextStart.toISOString(),
          end: nextEnd.toISOString(),
          aiPlanned: false,
          reason: "Người dùng kéo thả lịch",
        },
        status: "scheduled",
      });
      if (ok) {
        message.success("Đã di chuyển lịch công việc");
      }
    } catch (error: any) {
      message.error(
        error?.message || "Không thể di chuyển lịch vào vị trí này",
      );
    }
  };

  const handleMoveBlocked = (_event: CalendarEvent, reason: string) => {
    message.warning(reason || "Không thể di chuyển phiên lịch này");
  };

  // Event handlers
  const handleSaveSelectedEventTime = async (
    event: CalendarEvent,
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
  ) => {
    try {
      if (event.aiScheduled && event.scheduleId && event.sessionId) {
        const newTime = `${start.format("HH:mm")} - ${end.format("HH:mm")}`;
        await updateAISessionTime(event.scheduleId, event.sessionId, newTime);
        await fetchAISchedule();
        message.success("Đã cập nhật thời gian AI");
      } else {
        const ok = await handleUpdate(event.id, {
          scheduledTime: {
            start: start.toISOString(),
            end: end.toISOString(),
            aiPlanned: false,
            reason: "Người dùng sửa",
          },
          status: "scheduled",
        });
        if (ok) message.success("Đã cập nhật thời gian");
      }
      setSelectedEvent((prev) => (prev ? { ...prev, start, end } : prev));
      setEventModalOpen(false);
    } catch (error: any) {
      message.error(error?.message || "Không thể cập nhật");
    }
  };

  const handleDeleteSelectedEvent = async (event: CalendarEvent) => {
    try {
      if (event.aiScheduled && event.scheduleId && event.sessionId) {
        hideEvent(event.id);
        await deleteAISession(event.scheduleId, event.sessionId);
        await fetchAISchedule();
        message.success("Đã xóa sự kiện lịch AI");
      } else {
        const ok = await handleDelete(event.id);
        if (ok) message.success("Đã xóa công việc");
      }
      setEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error: any) {
      unhideEvent(event.id);
      message.error(error?.message || "Không thể xóa");
    }
  };

  const analyzeSchedule = async () => {
    const pendingTasks = tasks.filter(
      (t: any) => t.status !== "completed" && t.status !== "done",
    );
    if (pendingTasks.length === 0) {
      message.info("Không có công việc nào cần lên lịch!");
      return;
    }
    setAiLoading(true);
    try {
      const taskIds = pendingTasks.slice(0, 10).map((t: any) => t._id || t.id);
      const result = await aiSchedulePlan({
        taskIds,
        startDate: currentWeek.format("YYYY-MM-DD"),
      });
      setAiScheduleLocal(result);
      setScheduleModalOpen(true);
      message.success("AI đã phân tích và tạo lịch tối ưu!");
    } catch (error: any) {
      message.error(error?.message || "Không thể tạo lịch. Vui lòng thử lại!");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteAISchedule = async () => {
    if (!activeSchedule?.id) return;
    try {
      await deleteAISchedule(activeSchedule.id);
      message.success("Đã xóa lịch AI");
      fetchAISchedule();
    } catch (error: any) {
      message.error(error?.message || "Không thể xóa lịch AI");
    }
  };

  const applyAiSchedule = async () => {
    if (!aiScheduleLocal) return;
    setAiApplying(true);
    try {
      const result = await saveAISchedule(aiScheduleLocal);
      message.success(result.message || `Đã lưu lịch trình`);
      await fetchAISchedule();
      setScheduleModalOpen(false);
    } catch (error: any) {
      message.error(error?.message || "Lỗi khi áp dụng lịch AI");
    } finally {
      setAiApplying(false);
    }
  };

  return (
    <div className="calendar-page">
      <main className="calendar-main">
        <div className="calendar-header">
          <div className="header-left" style={{ minWidth: 200 }} />
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
          <CalendarSidebar
            miniCalendarMonth={miniCalendarMonth}
            setMiniCalendarMonth={setMiniCalendarMonth}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            events={events}
            onCreateClick={() => {
              const start = dayjs().add(1, "hour").minute(0).second(0);
              const end = start.add(1, "hour");
              setCreateStart(start);
              setCreateEnd(end);
              setCreateModalOpen(true);
            }}
            onOpenAvailabilitySettings={() => setAvailabilityModalOpen(true)}
          />

          <CalendarGrid
            tasksLoading={tasksLoading}
            events={events}
            weekDays={weekDays}
            onGridClick={openCreateTaskModalFromClick}
            onEventClick={openEventModal}
            onEventMove={handleEventMove}
            onMoveBlocked={handleMoveBlocked}
          />
        </div>

        <AISuggestionsPanel
          aiSchedule={aiScheduleLocal}
          onViewDetails={() => setScheduleModalOpen(true)}
        />
      </main>

      <CreateEventModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        initialStart={createStart}
        initialEnd={createEnd}
        onSave={handleCreate}
        googleUser={googleUser}
        isGoogleLoading={isGoogleLoading}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
      />

      <EventDetailModal
        open={eventModalOpen}
        event={selectedEvent}
        onCancel={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSaveTime={handleSaveSelectedEventTime}
        onDelete={handleDeleteSelectedEvent}
      />

      <AIScheduleModal
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        aiSchedule={aiScheduleLocal}
        onApply={applyAiSchedule}
        aiApplying={aiApplying}
      />

      <AvailabilitySettingsModal
        open={availabilityModalOpen}
        onCancel={() => setAvailabilityModalOpen(false)}
      />
    </div>
  );
}

export default Calendar;
