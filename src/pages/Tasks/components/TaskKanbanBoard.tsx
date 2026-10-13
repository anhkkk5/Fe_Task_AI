import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  UnorderedListOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { TaskKanbanColumn } from "./TaskKanbanColumn";
import type { TaskItem } from "../types";

interface TaskKanbanBoardProps {
  tasks: TaskItem[];
  loading: boolean;
  onDropTask: (taskId: string, targetStatus: string) => void;
  onEditClick: (task: TaskItem) => void;
  onDeleteClick: (task: TaskItem) => void;
  onBreakdownClick: (task: TaskItem) => void;
  onOpenCreateModal: () => void;
  onTaskClick?: (task: TaskItem) => void;
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  loading,
  onDropTask,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onOpenCreateModal,
  onTaskClick,
}) => {
  // Phân chia danh sách task theo 4 trạng thái nghiệp vụ
  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === "todo"),
    [tasks],
  );
  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.status === "scheduled"),
    [tasks],
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "in_progress"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks],
  );

  const columns = [
    {
      status: "todo",
      title: "Chờ xử lý",
      icon: <UnorderedListOutlined />,
      accentColor: "#64748b",
      badgeBg: "#f1f5f9",
      tasks: todoTasks,
      onAddNewTask: onOpenCreateModal,
    },
    {
      status: "scheduled",
      title: "Đã lên lịch",
      icon: <ScheduleOutlined />,
      accentColor: "#16a34a",
      badgeBg: "#f0fdf4",
      tasks: scheduledTasks,
    },
    {
      status: "in_progress",
      title: "Đang thực hiện",
      icon: <ClockCircleOutlined />,
      accentColor: "#d97706",
      badgeBg: "#fef3c7",
      tasks: inProgressTasks,
    },
    {
      status: "completed",
      title: "Đã hoàn thành",
      icon: <CheckCircleOutlined />,
      accentColor: "#0d9488",
      badgeBg: "#f0fdfa",
      tasks: completedTasks,
    },
  ];

  if (loading && tasks.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <Spin size="large" tip="Đang tải bảng Kanban..." />
      </div>
    );
  }

  return (
    <div
      className="tasks-kanban-board"
      style={{
        display: "flex",
        gap: 16,
        overflowX: "auto",
        paddingBottom: 16,
        alignItems: "flex-start",
      }}
    >
      {columns.map((col) => (
        <TaskKanbanColumn
          key={col.status}
          status={col.status}
          title={col.title}
          icon={col.icon}
          accentColor={col.accentColor}
          badgeBg={col.badgeBg}
          tasks={col.tasks || []}
          onDropTask={onDropTask}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onBreakdownClick={onBreakdownClick}
          onAddNewTask={col.onAddNewTask}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
};
