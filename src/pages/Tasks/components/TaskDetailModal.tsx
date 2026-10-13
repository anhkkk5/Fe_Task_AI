import React from "react";
import {
  Modal,
  Typography,
  Tag,
  Space,
  Button,
  Divider,
  Progress,
  Checkbox,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import type { TaskItem } from "../types";
import { minutesToHourString } from "../../../utils/timeParser";

const { Title, Text, Paragraph } = Typography;

interface TaskDetailModalProps {
  open: boolean;
  task: TaskItem | null;
  onCancel: () => void;
  onEditClick: (task: TaskItem) => void;
  onDeleteClick: (task: TaskItem) => void;
  onBreakdownClick: (task: TaskItem) => void;
  onSubtaskToggle?: (task: TaskItem, subtaskIndex: number, newStatus: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  task,
  onCancel,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onSubtaskToggle,
}) => {
  if (!task) return null;

  const priorityMap: Record<
    string,
    { color: string; text: string; bg: string }
  > = {
    low: { color: "#64748b", text: "Thấp", bg: "#f1f5f9" },
    medium: { color: "#d97706", text: "Trung bình", bg: "#fef3c7" },
    high: { color: "#ea580c", text: "Cao", bg: "#ffedd5" },
    urgent: { color: "#dc2626", text: "Khẩn cấp", bg: "#fee2e2" },
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    todo: { color: "default", text: "Cần làm" },
    scheduled: { color: "processing", text: "Đã lên lịch" },
    in_progress: { color: "warning", text: "Đang thực hiện" },
    completed: { color: "success", text: "Hoàn thành" },
    cancelled: { color: "error", text: "Đã hủy" },
  };

  const priorityInfo = priorityMap[task.priority] || priorityMap.medium;
  const statusInfo = statusMap[task.status] || { color: "default", text: task.status };

  const subtaskList = task.aiBreakdown || task.subtasks || [];
  const completedCount = subtaskList.filter(
    (st: any) => st.status === "completed" || st.status === "done",
  ).length;
  const progressPercent =
    subtaskList.length > 0
      ? Math.round((completedCount / subtaskList.length) * 100)
      : task.status === "completed"
      ? 100
      : 0;

  // Tính chuỗi Mục tiêu/ngày
  let dailyTargetText = "";
  if (task.dailyTargetDuration) {
    const minMins = task.dailyTargetMin || Math.floor(task.dailyTargetDuration * 0.8);
    dailyTargetText = `${minutesToHourString(minMins)} - ${minutesToHourString(task.dailyTargetDuration)} / ngày`;
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={640}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 24 }}>
          <Title level={4} style={{ margin: 0, color: "#1e293b", flex: 1 }}>
            {task.title}
          </Title>
          {task.aiAssisted && (
            <Tooltip title="AI đã phân tích & hỗ trợ lập lịch">
              <Tag color="cyan" icon={<RobotOutlined />}>
                AI Assisted
              </Tag>
            </Tooltip>
          )}
        </div>
      }
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              onCancel();
              onDeleteClick(task);
            }}
          >
            Xóa việc
          </Button>

          <Space>
            <Button
              icon={<RobotOutlined />}
              onClick={() => {
                onCancel();
                onBreakdownClick(task);
              }}
            >
              AI Phân rã việc
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                onCancel();
                onEditClick(task);
              }}
            >
              Chỉnh sửa
            </Button>
          </Space>
        </div>
      }
    >
      <div style={{ marginTop: 16 }}>
        {/* Badges Status & Priority */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Tag color={statusInfo.color} style={{ fontSize: 13, padding: "3px 10px" }}>
            Trạng thái: <strong>{statusInfo.text}</strong>
          </Tag>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 4,
              background: priorityInfo.bg,
              color: priorityInfo.color,
            }}
          >
            Ưu tiên: {priorityInfo.text}
          </span>
          {task.tags &&
            task.tags.map((tag) => (
              <Tag key={tag} color="blue" style={{ borderRadius: 4 }}>
                #{tag}
              </Tag>
            ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ color: "#475569" }}>
            Mô tả công việc:
          </Text>
          <Paragraph
            style={{
              marginTop: 6,
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              color: task.description ? "#334155" : "#94a3b8",
              fontStyle: task.description ? "normal" : "italic",
            }}
          >
            {task.description || "Chưa có mô tả chi tiết cho công việc này."}
          </Paragraph>
        </div>

        {/* Timeline & Duration Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: 14,
            backgroundColor: "#f1f5f9",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              <CalendarOutlined style={{ marginRight: 4 }} /> Ngày bắt đầu:
            </Text>
            <Text strong>
              {task.startAt
                ? new Date(task.startAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Chưa xác định"}
            </Text>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              <CalendarOutlined style={{ marginRight: 4 }} /> Hạn chót (Deadline):
            </Text>
            <Text strong style={{ color: task.dueDate ? "#e11d48" : "inherit" }}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Không có hạn chót"}
            </Text>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Thời lượng ước tính:
            </Text>
            <Text strong style={{ color: "#2563eb" }}>
              {task.estimatedDuration
                ? `${Math.floor(task.estimatedDuration / 60)}h ${
                    task.estimatedDuration % 60 > 0 ? `${task.estimatedDuration % 60}m` : ""
                  } (${task.estimatedDuration} phút)`
                : "Chưa ước tính"}
            </Text>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              <AimOutlined style={{ marginRight: 4 }} /> Mục tiêu / ngày:
            </Text>
            <Text strong style={{ color: dailyTargetText ? "#16a34a" : "#64748b" }}>
              {dailyTargetText || "Không đặt mục tiêu ngày"}
            </Text>
          </div>
        </div>

        {/* Mục tiêu ngày Note (nếu có) */}
        {dailyTargetText && (
          <div
            style={{
              padding: "8px 12px",
              background: "#ecfdf5",
              borderRadius: 6,
              border: "1px solid #a7f3d0",
              fontSize: 12,
              color: "#065f46",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FieldTimeOutlined />
            <span>
              <strong>Mục tiêu tiến độ:</strong> Mỗi ngày AI sẽ ưu tiên xếp từ{" "}
              <strong>{dailyTargetText}</strong> vào lịch trình cho đến khi hoàn tất.
            </span>
          </div>
        )}

        <Divider style={{ margin: "16px 0" }} />

        {/* Subtasks / AI Breakdown Checklist */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text strong style={{ fontSize: 14 }}>
              <CheckCircleOutlined style={{ marginRight: 6, color: "#10b981" }} />
              Công việc con & Các bước thực hiện ({completedCount}/{subtaskList.length})
            </Text>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
              {progressPercent}%
            </span>
          </div>

          <Progress
            percent={progressPercent}
            strokeColor="#10b981"
            size="small"
            style={{ marginBottom: 14 }}
          />

          {subtaskList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
              }}
            >
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Chưa có công việc con nào.
              </Text>
              <Button
                size="small"
                icon={<RobotOutlined />}
                onClick={() => {
                  onCancel();
                  onBreakdownClick(task);
                }}
              >
                Nhờ AI chia nhỏ công việc này
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 220,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {subtaskList.map((st: any, idx: number) => {
                const isDone = st.status === "completed" || st.status === "done";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: isDone ? "#f8fafc" : "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                    }}
                  >
                    <Checkbox
                      checked={isDone}
                      onChange={(e) => {
                        if (onSubtaskToggle) {
                          onSubtaskToggle(
                            task,
                            idx,
                            e.target.checked ? "completed" : "todo",
                          );
                        }
                      }}
                    >
                      <Text
                        delete={isDone}
                        style={{
                          color: isDone ? "#94a3b8" : "#1e293b",
                          fontSize: 13,
                        }}
                      >
                        {st.title}
                      </Text>
                    </Checkbox>

                    {st.estimatedDuration && (
                      <Tag style={{ margin: 0, fontSize: 11 }}>
                        {st.estimatedDuration}m
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
