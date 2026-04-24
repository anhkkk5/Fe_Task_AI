import React from "react";
import { Select, Tag, Typography, Space } from "antd";
import { MessageOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { Subtask, SubtaskStatus } from "../../services/taskServices";

const { Text } = Typography;

interface SubtaskItemProps {
  subtask: Subtask;
  index: number;
  parentTaskTitle: string;
  onChatOpen: (subtask: Subtask, parentTaskTitle: string) => void;
  onStatusChange: (index: number, status: SubtaskStatus) => void;
}

const difficultyColor: Record<string, string> = {
  easy: "green",
  medium: "orange",
  hard: "red",
};

const statusOptions = [
  { value: "todo", label: "Chưa làm" },
  { value: "in_progress", label: "Đang làm" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Hủy" },
];

const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  index,
  parentTaskTitle,
  onChatOpen,
  onStatusChange,
}) => {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        background: subtask.status === "completed" ? "#f6ffed" : "#fafafa",
        border: "1px solid",
        borderColor: subtask.status === "completed" ? "#b7eb8f" : "#f0f0f0",
        marginBottom: 8,
      }}
    >
      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
        {/* Title row */}
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text
            strong
            style={{
              cursor: "pointer",
              color: "#1677ff",
              textDecoration:
                subtask.status === "completed" ? "line-through" : "none",
              fontSize: 14,
            }}
            onClick={() => onChatOpen(subtask, parentTaskTitle)}
          >
            <MessageOutlined style={{ marginRight: 6, fontSize: 12 }} />
            {subtask.title}
          </Text>
          <Select
            size="small"
            value={subtask.status}
            options={statusOptions}
            onChange={(val) => onStatusChange(index, val as SubtaskStatus)}
            style={{ width: 120 }}
          />
        </Space>

        {/* Meta row */}
        <Space size={8} wrap>
          {subtask.difficulty && (
            <Tag
              color={difficultyColor[subtask.difficulty]}
              style={{ margin: 0 }}
            >
              {subtask.difficulty === "easy"
                ? "Dễ"
                : subtask.difficulty === "medium"
                  ? "Trung bình"
                  : "Khó"}
            </Tag>
          )}
          {subtask.estimatedDuration && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {subtask.estimatedDuration} phút
            </Text>
          )}
        </Space>

        {/* Description */}
        {subtask.description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {subtask.description}
          </Text>
        )}
      </Space>
    </div>
  );
};

export default SubtaskItem;
