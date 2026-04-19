import React from "react";
import { Alert, Typography, Space } from "antd";
import { RobotOutlined, ClockCircleOutlined } from "@ant-design/icons";
import SubtaskItem from "./SubtaskItem";
import type { Subtask, SubtaskStatus } from "../../services/taskServices";

const { Text } = Typography;

interface SubtaskListProps {
  subtasks: Subtask[];
  parentTaskTitle: string;
  onSubtaskClick: (subtask: Subtask) => void;
  onStatusChange: (subtaskIndex: number, status: SubtaskStatus) => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  parentTaskTitle,
  onSubtaskClick,
  onStatusChange,
}) => {
  const allCompleted =
    subtasks.length > 0 && subtasks.every((s) => s.status === "completed");

  const totalMinutes = subtasks.reduce(
    (sum, s) => sum + (s.estimatedDuration ?? 0),
    0,
  );

  return (
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <Space style={{ marginBottom: 8 }}>
        <RobotOutlined style={{ color: "#1677ff" }} />
        <Text strong style={{ fontSize: 13 }}>
          AI Breakdown ({subtasks.length} bước)
        </Text>
        {totalMinutes > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />~{totalMinutes}{" "}
            phút
          </Text>
        )}
      </Space>

      {/* Subtask items */}
      <div>
        {subtasks.map((subtask, index) => (
          <SubtaskItem
            key={index}
            subtask={subtask}
            index={index}
            parentTaskTitle={parentTaskTitle}
            onChatOpen={onSubtaskClick}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {/* All completed alert */}
      {allCompleted && (
        <Alert
          type="success"
          showIcon
          message="Tất cả bước đã hoàn thành! Bạn có muốn đánh dấu task này là hoàn thành không?"
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};

export default SubtaskList;
