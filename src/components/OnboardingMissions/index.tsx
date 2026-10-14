import { useState, useEffect } from "react";
import { Button, message } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RocketOutlined,
  CheckOutlined,
  MinusOutlined,
  CloseOutlined,
  TrophyOutlined,
  PlusCircleOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import "./OnboardingMissions.scss";

export function showOnboardingMissions() {
  window.dispatchEvent(new CustomEvent("taskmind-show-missions"));
}

export default function OnboardingMissions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: any) => state.auth);

  const storageKey = user?._id || user?.id
    ? `taskmind_missions_${user?._id || user?.id}`
    : "taskmind_missions_guest";

  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      taskCreated: false,
      calendarVisited: false,
      aiUsed: false,
      minimized: false,
      dismissed: false,
    };
  });

  const saveState = (newState: typeof state) => {
    setState(newState);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch {}
  };

  const markDone = (key: "taskCreated" | "calendarVisited" | "aiUsed") => {
    setState((prev: any) => {
      if (prev[key]) return prev;
      const updated = { ...prev, [key]: true };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-detect calendar visit
  useEffect(() => {
    if (location.pathname === "/calendar") {
      markDone("calendarVisited");
    }
  }, [location.pathname]);

  // Listen for real-time mission completion events
  useEffect(() => {
    const onTaskCreated = () => markDone("taskCreated");
    const onCalendarVisited = () => markDone("calendarVisited");
    const onAiUsed = () => markDone("aiUsed");
    const onShow = () => {
      saveState({ ...state, dismissed: false, minimized: false });
    };

    window.addEventListener("taskmind-mission-task-created", onTaskCreated);
    window.addEventListener("taskmind-mission-calendar-visited", onCalendarVisited);
    window.addEventListener("taskmind-mission-ai-used", onAiUsed);
    window.addEventListener("taskmind-show-missions", onShow);

    return () => {
      window.removeEventListener("taskmind-mission-task-created", onTaskCreated);
      window.removeEventListener("taskmind-mission-calendar-visited", onCalendarVisited);
      window.removeEventListener("taskmind-mission-ai-used", onAiUsed);
      window.removeEventListener("taskmind-show-missions", onShow);
    };
  }, [state, storageKey]);

  if (state.dismissed) return null;

  const completedCount =
    (state.taskCreated ? 1 : 0) +
    (state.calendarVisited ? 1 : 0) +
    (state.aiUsed ? 1 : 0);

  const percent = Math.round((completedCount / 3) * 100);
  const isAllDone = completedCount === 3;

  // Handlers for mission action buttons
  const handleActionTask = () => {
    if (location.pathname !== "/tasks") {
      navigate("/tasks");
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("taskmind-open-create-task"));
    }, 200);
  };

  const handleActionCalendar = () => {
    markDone("calendarVisited");
    if (location.pathname !== "/calendar") {
      navigate("/calendar");
    }
    message.info("💡 Bạn có thể nhấp vào bất kỳ khung giờ nào trên Lịch để tạo khung giờ học tập, làm việc hoặc giờ họp!");
  };

  const handleActionAI = () => {
    if (location.pathname !== "/tasks") {
      navigate("/tasks");
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("taskmind-open-scheduler"));
      markDone("aiUsed");
    }, 200);
  };

  if (state.minimized) {
    return (
      <div className="onboarding-missions-container">
        <button
          type="button"
          className={`missions-trigger-btn ${isAllDone ? "completed-btn" : ""}`}
          onClick={() => saveState({ ...state, minimized: false })}
          title="Mở Nhiệm vụ nhập môn"
        >
          <RocketOutlined className="trigger-icon" />
          <span className="trigger-text">
            {isAllDone ? "Nhập môn hoàn tất! 🏆" : "Nhiệm vụ nhập môn"}
          </span>
          <span className="trigger-badge">{completedCount}/3</span>
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-missions-container">
      <div className="missions-card">
        {/* Header */}
        <div className="missions-header">
          <div className="header-title-wrap">
            <RocketOutlined className="header-icon" />
            <div>
              <div className="header-title">Hành trình Nhập môn TaskMind</div>
              <div className="header-subtitle">Thực hành 3 bước thiết yếu</div>
            </div>
          </div>
          <div className="header-controls">
            <button
              type="button"
              className="control-btn"
              onClick={() => saveState({ ...state, minimized: true })}
              title="Thu nhỏ"
            >
              <MinusOutlined />
            </button>
            <button
              type="button"
              className="control-btn"
              onClick={() => saveState({ ...state, dismissed: true })}
              title="Đóng"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="missions-progress-bar-wrap">
          <div className="progress-label-row">
            <span>Tiến độ thực hành</span>
            <span className="progress-percent">{percent}% ({completedCount}/3)</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Missions List */}
        <div className="missions-list">
          {/* Mission 1 */}
          <div className={`mission-item ${state.taskCreated ? "done" : ""}`}>
            <div className={`mission-checkbox ${state.taskCreated ? "checked" : ""}`}>
              {state.taskCreated && <CheckOutlined />}
            </div>
            <div className="mission-content">
              <div className="mission-title">1. Tạo công việc đầu tiên ✍️</div>
              <div className="mission-desc">
                Thêm task, đặt deadline và ước tính thời lượng (ví dụ: 60m, 2h) để AI có dữ liệu sắp xếp.
              </div>
              {!state.taskCreated && (
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  className="mission-action-btn"
                  onClick={handleActionTask}
                >
                  Tạo ngay
                </Button>
              )}
            </div>
          </div>

          {/* Mission 2 */}
          <div className={`mission-item ${state.calendarVisited ? "done" : ""}`}>
            <div className={`mission-checkbox ${state.calendarVisited ? "checked" : ""}`}>
              {state.calendarVisited && <CheckOutlined />}
            </div>
            <div className="mission-content">
              <div className="mission-title">2. Thiết lập Lịch biểu cá nhân 📅</div>
              <div className="mission-desc">
                Khám phá timeline và thiết lập khung giờ cố định (không cho chèn) hoặc giờ học tập (cho phép AI chèn).
              </div>
              {!state.calendarVisited && (
                <Button
                  size="small"
                  icon={<CalendarOutlined />}
                  className="mission-action-btn"
                  onClick={handleActionCalendar}
                >
                  Mở Lịch ngay
                </Button>
              )}
            </div>
          </div>

          {/* Mission 3 */}
          <div className={`mission-item ${state.aiUsed ? "done" : ""}`}>
            <div className={`mission-checkbox ${state.aiUsed ? "checked" : ""}`}>
              {state.aiUsed && <CheckOutlined />}
            </div>
            <div className="mission-content">
              <div className="mission-title">3. Tối ưu lịch & Phân tích bằng AI ⚡</div>
              <div className="mission-desc">
                Trải nghiệm 1-click để AI tự động phân bổ toàn bộ công việc vào các khung giờ trống trên Calendar!
              </div>
              {!state.aiUsed && (
                <Button
                  size="small"
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  className="mission-action-btn"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    border: "none",
                  }}
                  onClick={handleActionAI}
                >
                  Chạy AI Lập lịch
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Congratulations Banner */}
        {isAllDone && (
          <div className="missions-congrats">
            <TrophyOutlined style={{ fontSize: 24, color: "#eab308", marginBottom: 6 }} />
            <div className="congrats-title">Xuất sắc! Bạn đã hoàn thành khóa nhập môn!</div>
            <div className="congrats-desc">
              Bạn đã nắm vững toàn bộ các kỹ năng cốt lõi để làm chủ thời gian cùng TaskMind AI.
            </div>
            <Button
              size="small"
              type="primary"
              onClick={() => saveState({ ...state, minimized: true })}
            >
              Thu nhỏ bảng nhiệm vụ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
