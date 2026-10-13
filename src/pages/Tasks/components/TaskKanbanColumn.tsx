import React, { useState } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { TaskKanbanCard } from "./TaskKanbanCard";
import type { TaskItem } from "../types";

interface TaskKanbanColumnProps {
  status: string;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  tasks: TaskItem[];
  onDropTask: (taskId: string, targetStatus: string) => void;
  onEditClick: (task: TaskItem) => void;
  onDeleteClick: (task: TaskItem) => void;
  onBreakdownClick: (task: TaskItem) => void;
  onAddNewTask?: () => void;
  onTaskClick?: (task: TaskItem) => void;
}

export const TaskKanbanColumn: React.FC<TaskKanbanColumnProps> = ({
  status,
  title,
  icon,
  accentColor,
  badgeBg,
  tasks,
  onDropTask,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onAddNewTask,
  onTaskClick,
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Chỉ tắt highlight khi rời khỏi chính column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      className={`kanban-column ${isOver ? "kanban-column--drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: "1 1 300px",
        minWidth: 280,
        maxWidth: 380,
        background: isOver ? "rgba(59, 130, 246, 0.05)" : "#f8fafc",
        borderRadius: 12,
        border: isOver ? `2px dashed ${accentColor}` : "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 240px)",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: accentColor, fontSize: 16 }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
            {title}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "1px 8px",
              borderRadius: 12,
              background: badgeBg,
              color: accentColor,
            }}
          >
            {tasks.length}
          </span>
        </div>

        {onAddNewTask && (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={onAddNewTask}
            style={{ color: "#64748b" }}
          />
        )}
      </div>

      {/* Cards Scrollable List */}
      <div
        style={{
          padding: 12,
          overflowY: "auto",
          flex: 1,
          minHeight: 180,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              height: "100%",
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              padding: "16px 8px",
              background: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Kéo thả công việc vào đây
            </span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              onBreakdownClick={onBreakdownClick}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
