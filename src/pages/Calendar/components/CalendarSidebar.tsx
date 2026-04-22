import React from "react";
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { CalendarEvent } from "../types";

interface CalendarSidebarProps {
  miniCalendarMonth: dayjs.Dayjs;
  setMiniCalendarMonth: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  currentWeek: dayjs.Dayjs;
  setCurrentWeek: (date: dayjs.Dayjs) => void;
  events: CalendarEvent[];
  onCreateClick: () => void;
  onOpenAvailabilitySettings: () => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  miniCalendarMonth,
  setMiniCalendarMonth,
  currentWeek,
  setCurrentWeek,
  events,
  onCreateClick,
  onOpenAvailabilitySettings,
}) => {
  // Generate mini calendar days
  const startOfMonth = miniCalendarMonth.startOf("month");
  const endOfMonth = miniCalendarMonth.endOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  const miniCalendarDays: dayjs.Dayjs[] = [];
  for (let i = startDay; i > 0; i--) {
    miniCalendarDays.push(startOfMonth.subtract(i, "day"));
  }
  for (let i = 0; i < daysInMonth; i++) {
    miniCalendarDays.push(startOfMonth.add(i, "day"));
  }
  const remainingDays = 42 - miniCalendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    miniCalendarDays.push(endOfMonth.add(i, "day"));
  }

  return (
    <aside className="calendar-sidebar">
      <button className="sidebar-create-btn" onClick={onCreateClick}>
        <PlusOutlined /> Tạo
      </button>

      <button
        className="sidebar-availability-btn"
        onClick={onOpenAvailabilitySettings}
      >
        <ClockCircleOutlined /> Lịch rảnh
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
              onClick={() => setMiniCalendarMonth((m) => m.add(1, "month"))}
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
            const isCurrentMonth = day.month() === miniCalendarMonth.month();
            const isToday = day.isSame(dayjs(), "day");
            const isSelected =
              day.isSame(currentWeek, "week") && day.day() === 0;
            const hasEvent = events.some((e) => e.start.isSame(day, "day"));

            return (
              <div
                key={idx}
                className={`mini-calendar-day ${!isCurrentMonth ? "other-month" : ""} ${
                  isToday ? "today" : ""
                } ${isSelected ? "selected" : ""} ${hasEvent ? "has-events" : ""}`}
                onClick={() => setCurrentWeek(day.startOf("week"))}
              >
                {day.date()}
              </div>
            );
          })}
        </div>
      </div>

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
  );
};
