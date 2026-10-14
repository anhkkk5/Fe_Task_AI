import React, { useState } from "react";
import { Tag, Typography, Avatar, Tooltip, Dropdown, Button, Space } from "antd";
import type { MenuProps } from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { TaskItem } from "../types";

const { Text } = Typography;

interface TaskKanbanCardProps {
  task: TaskItem;
  onEditClick: (task: TaskItem) => void;
  onDeleteClick: (task: TaskItem) => void;
  onBreakdownClick: (task: TaskItem) => void;
  onTaskClick?: (task: TaskItem) => void;
  onExtendClick?: (task: TaskItem) => void;
}

export const TaskKanbanCard: React.FC<TaskKanbanCardProps> = ({
  task,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onTaskClick,
  onExtendClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const priorityMap: Record<string, { color: string; text: string; bg: string }> = {
    low: { color: "#64748b", text: "Thấp", bg: "#f1f5f9" },
    medium: { color: "#d97706", text: "Trung bình", bg: "#fef3c7" },
    high: { color: "#ea580c", text: "Cao", bg: "#ffedd5" },
    urgent: { color: "#dc2626", text: "Khẩn cấp", bg: "#fee2e2" },
  };

  const priorityInfo = priorityMap[task.priority] || priorityMap.medium;

  // Tính số subtask đã xong
  const subtasksList = task.subtasks || task.aiBreakdown || [];
  const completedSubtasks = subtasksList.filter(
    (st: any) => st.status === "completed" || st.status === "done",
  ).length;

  // Kiểm tra quá hạn
  const isOverdue = Boolean(
    task.isOverdue ||
    (task.dueDate &&
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      new Date(task.dueDate).getTime() < Date.now())
  );

  const menuItems: MenuProps["items"] = [
    {
      key: "extend",
      icon: <ClockCircleOutlined />,
      label: task.extensionRequest?.status === "pending"
        ? "Xem / Duyệt gia hạn"
        : task.teamId
          ? "Gia hạn / Yêu cầu gia hạn"
          : "Gia hạn hạn chót",
      onClick: () => onExtendClick?.(task),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Chỉnh sửa",
      onClick: () => onEditClick(task),
    },
    {
      key: "breakdown",
      icon: <RobotOutlined />,
      label: "AI Breakdown",
      onClick: () => onBreakdownClick(task),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Xóa",
      danger: true,
      onClick: () => onDeleteClick(task),
    },
  ];

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`kanban-card ${isDragging ? "kanban-card--dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(".ant-dropdown-trigger") ||
          target.closest(".ant-btn") ||
          target.closest(".ant-dropdown")
        ) {
          return;
        }
        if (onTaskClick) {
          onTaskClick(task);
        } else {
          onEditClick(task);
        }
      }}
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 12,
        boxShadow: isDragging
          ? "0 8px 20px rgba(0, 0, 0, 0.15)"
          : "0 2px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {/* Header: Priority + Action menu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 6,
              background: priorityInfo.bg,
              color: priorityInfo.color,
            }}
          >
            {priorityInfo.text}
          </span>
          {isOverdue && (
            <Tag color="error" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
              Quá hạn
            </Tag>
          )}
          {task.extensionRequest?.status === "pending" && (
            <Tag color="purple" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
              Chờ gia hạn
            </Tag>
          )}
        </div>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{ color: "#94a3b8" }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      {/* Task Title */}
      <div style={{ marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 6 }}>
        <Text
          strong
          style={{
            fontSize: 14,
            color: "#1e293b",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {task.title}
        </Text>
        {task.aiAssisted && (
          <Tooltip title="AI đã hỗ trợ phân rã">
            <RobotOutlined style={{ color: "#1677ff", fontSize: 14, marginTop: 3 }} />
          </Tooltip>
        )}
      </div>

      {/* Description snippet */}
      {task.description && (
        <Text
          type="secondary"
          style={{
            fontSize: 12,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 10,
            color: "#64748b",
          }}
        >
          {task.description}
        </Text>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {task.tags.slice(0, 3).map((tag) => (
            <Tag
              key={tag}
              style={{
                fontSize: 11,
                borderRadius: 4,
                margin: 0,
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
              }}
            >
              #{tag}
            </Tag>
          ))}
          {task.tags.length > 3 && (
            <Tag style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
              +{task.tags.length - 3}
            </Tag>
          )}
        </div>
      )}

      {/* Footer: Date, Subtasks & Assignee */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
          marginTop: 6,
        }}
      >
        <Space size={10}>
          {/* Due date */}
          {task.dueDate && (
            <Tooltip title={`Hạn chót: ${new Date(task.dueDate).toLocaleDateString("vi-VN")}`}>
              <span
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: isOverdue ? "#ef4444" : "#64748b",
                  fontWeight: isOverdue ? 600 : 400,
                }}
              >
                <CalendarOutlined />
                {new Date(task.dueDate).toLocaleDateString("vi-VN", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
            </Tooltip>
          )}

          {/* Subtasks counter */}
          {subtasksList.length > 0 && (
            <Tooltip title={`Tiến độ Subtask: ${completedSubtasks}/${subtasksList.length}`}>
              <span
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: completedSubtasks === subtasksList.length ? "#10b981" : "#64748b",
                }}
              >
                <CheckCircleOutlined />
                {completedSubtasks}/{subtasksList.length}
              </span>
            </Tooltip>
          )}

          {/* Estimated duration */}
          {task.estimatedDuration && (
            <Tooltip title={`Thời lượng dự kiến: ${task.estimatedDuration} phút`}>
              <span
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#64748b",
                }}
              >
                <ClockCircleOutlined />
                {Math.floor(task.estimatedDuration / 60)}h
                {task.estimatedDuration % 60 > 0 ? `${task.estimatedDuration % 60}m` : ""}
              </span>
            </Tooltip>
          )}
        </Space>

        {/* Assignee Avatar */}
        <Tooltip title={`Phụ trách: ${task.assignee || "Bạn"}`}>
          <Avatar
            size={24}
            style={{
              backgroundColor: "#3b82f6",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {task.assignee?.charAt(0) || "B"}
          </Avatar>
        </Tooltip>
      </div>
    </div>
  );
};
