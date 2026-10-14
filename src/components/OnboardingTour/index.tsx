import { useState, useEffect } from "react";
import { Tour } from "antd";
import type { TourStepProps } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RocketOutlined,
  BookOutlined,
  CheckSquareOutlined,
  PlusCircleOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  TeamOutlined,
  CalendarOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import "./OnboardingTour.scss";

export function triggerOnboardingTour() {
  window.dispatchEvent(new CustomEvent("taskmind-start-tour"));
}

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: any) => state.auth);

  const getStorageKey = () => {
    const id = user?._id || user?.id;
    return id ? `taskmind_tour_completed_${id}` : "taskmind_tour_completed_guest";
  };

  // Check if first-time user and trigger tour
  useEffect(() => {
    const tourKey = getStorageKey();
    const hasCompleted = localStorage.getItem(tourKey);

    if (!hasCompleted && user) {
      // Delay slightly for initial layout and DOM to mount
      const timer = setTimeout(() => {
        if (!localStorage.getItem(tourKey)) {
          // If not on /tasks, navigate to /tasks for best tour experience
          if (location.pathname !== "/tasks") {
            navigate("/tasks");
          }
          setOpen(true);
        }
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [user]);

  // Listen to manual start request (e.g. from Guide page)
  useEffect(() => {
    const handleManualStart = () => {
      setCurrent(0);
      if (location.pathname !== "/tasks") {
        navigate("/tasks");
      }
      setTimeout(() => {
        setOpen(true);
      }, 250);
    };

    window.addEventListener("taskmind-start-tour", handleManualStart);
    return () => {
      window.removeEventListener("taskmind-start-tour", handleManualStart);
    };
  }, [location.pathname, navigate]);

  const handleClose = () => {
    const tourKey = getStorageKey();
    localStorage.setItem(tourKey, "true");
    setOpen(false);
  };

  const handleFinish = () => {
    const tourKey = getStorageKey();
    localStorage.setItem(tourKey, "true");
    setOpen(false);
  };

  const steps: TourStepProps[] = [
    {
      title: (
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a" }}>
          <RocketOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Chào mừng đến với TaskMind AI!
        </span>
      ),
      description: (
        <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#475569" }}>
          Hệ thống quản lý công việc và tối ưu hóa thời gian thông minh bằng AI. Hãy cùng lướt nhanh qua các tính năng cốt lõi để bắt đầu làm việc hiệu quả ngay nhé!
        </div>
      ),
      target: null, // Centered modal
      nextButtonProps: { children: "Bắt đầu khám phá 👉" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <BookOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Cẩm nang & Hướng dẫn (Guide)
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Nơi tổng hợp toàn bộ quy trình sử dụng chuẩn xác, tài liệu chi tiết và là nơi bạn có thể mở lại Tour hướng dẫn này bất kỳ lúc nào.
        </div>
      ),
      target: () => document.getElementById("tour-nav-guide")!,
      placement: "right",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <CheckSquareOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Trung tâm Quản lý Công việc
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Nơi hiển thị toàn bộ nhiệm vụ cá nhân và việc nhóm. Theo dõi mức độ ưu tiên, tiến độ và hạn chót minh bạch.
        </div>
      ),
      target: () => document.getElementById("tour-nav-tasks")!,
      placement: "right",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <PlusCircleOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Tạo công việc & Ước lượng thông minh
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Bấm vào đây để tạo task mới. Thiết lập hạn chót (Deadline), thời lượng ước tính và khung giờ mục tiêu để AI có dữ liệu lập lịch chính xác.
        </div>
      ),
      target: () => document.getElementById("tour-add-task")!,
      placement: "bottomRight",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <ThunderboltOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
          Đột phá: AI Tối Ưu Lịch
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Chỉ với 1 click, AI sẽ tính toán thời gian, mức độ ưu tiên và thói quen sinh học của bạn để tự động phân bổ công việc vào Calendar mà không lo trùng lịch!
        </div>
      ),
      target: () => document.getElementById("tour-ai-scheduler")!,
      placement: "bottomRight",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <AppstoreOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Linh hoạt: Bảng & Kanban
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Chuyển đổi tức thì giữa <strong>Dạng danh sách</strong> chi tiết để tìm kiếm, lọc nhanh và <strong>Bảng Kanban</strong> kéo thả trạng thái trực quan.
        </div>
      ),
      target: () => document.getElementById("tour-view-mode")!,
      placement: "bottomRight",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <TeamOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Không gian Làm việc nhóm (Teams)
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Tạo nhóm dự án, mời đồng đội qua Email, phân công công việc và quản lý quy trình xin gia hạn hạn chót chuyên nghiệp theo vai trò.
        </div>
      ),
      target: () => document.getElementById("tour-nav-teams")!,
      placement: "right",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <CalendarOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Lịch biểu thời gian thực (Calendar)
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Xem dòng thời gian làm việc hàng ngày, nhận diện các khung giờ cố định và toàn bộ block công việc đã được AI tối ưu xếp vào lịch.
        </div>
      ),
      target: () => document.getElementById("tour-nav-calendar")!,
      placement: "right",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Tiếp tục" },
    },
    {
      title: (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          <RobotOutlined style={{ color: "#2563eb", marginRight: 8 }} />
          Trợ lý Chat AI Đồng hành
        </span>
      ),
      description: (
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#475569" }}>
          Trò chuyện trực tiếp với AI để lên lịch từng bước, hỏi cách giải quyết từng bước việc nhỏ (subtask) hoặc nhờ AI tư vấn nâng cao hiệu suất làm việc!
        </div>
      ),
      target: () => document.getElementById("tour-nav-chat")!,
      placement: "right",
      prevButtonProps: { children: "Quay lại" },
      nextButtonProps: { children: "Bắt đầu trải nghiệm! 🚀" },
    },
  ];

  return (
    <Tour
      open={open}
      current={current}
      onChange={(curr) => setCurrent(curr)}
      onClose={handleClose}
      onFinish={handleFinish}
      steps={steps}
      rootClassName="taskmind-tour-root"
      indicatorsRender={(curr, total) => (
        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
          {curr + 1} / {total}
        </span>
      )}
    />
  );
}
