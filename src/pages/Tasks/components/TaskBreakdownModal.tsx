import React from "react";
import { Modal, Space, Button, Card, Typography } from "antd";
import { RobotOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { SubtaskList } from "../../../components/SubtaskList";
import type {
  Subtask,
  SubtaskStatus,
  TaskEstimationExplanation,
} from "../../../services/taskServices";
import type { TaskItem } from "../types";

const { Text } = Typography;

interface TaskBreakdownModalProps {
  open: boolean;
  task: TaskItem | null;
  subtasks: Subtask[];
  breakdownLoading: boolean;
  explainLoading: boolean;
  estimationExplain: TaskEstimationExplanation | null;
  onCancel: () => void;
  onRegenerate: () => void;
  onSubtaskStatusChange: (index: number, status: SubtaskStatus) => void;
}

export const TaskBreakdownModal: React.FC<TaskBreakdownModalProps> = ({
  open,
  task,
  subtasks,
  breakdownLoading,
  explainLoading,
  estimationExplain,
  onCancel,
  onRegenerate,
  onSubtaskStatusChange,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: "#1677ff" }} />
          <span>AI Task Breakdown — {task?.title}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="regenerate"
          icon={<ReloadOutlined />}
          loading={breakdownLoading}
          onClick={onRegenerate}
        >
          Tạo lại Breakdown
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          Đóng
        </Button>,
      ]}
      width={680}
    >
      {estimationExplain && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: "#f6ffed",
            borderColor: "#b7eb8f",
          }}
        >
          <Space direction="vertical" size={2} style={{ width: "100%" }}>
            <Text strong style={{ color: "#389e0d" }}>
              Ước lượng thông minh ({estimationExplain.method.toUpperCase()}):{" "}
              {Math.floor(estimationExplain.result.estimatedDuration / 60)}h
              {estimationExplain.result.estimatedDuration % 60}m
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Độ tin cậy: {Math.round(estimationExplain.confidence * 100)}% •
              Mục tiêu/ngày {estimationExplain.result.dailyTargetMin}-
              {estimationExplain.result.dailyTargetDuration} phút
            </Text>
          </Space>
        </Card>
      )}

      {explainLoading && !estimationExplain && (
        <Text type="secondary">Đang tải giải thích ước lượng...</Text>
      )}

      {breakdownLoading && !subtasks.length ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Space direction="vertical">
            <RobotOutlined style={{ fontSize: 32, color: "#1677ff" }} />
            <Text>AI đang phân tích công việc...</Text>
          </Space>
        </div>
      ) : subtasks.length > 0 ? (
        <SubtaskList
          subtasks={subtasks}
          parentTaskTitle={task?.title ?? ""}
          onSubtaskClick={(subtask) => {
            onCancel();
            navigate("/chat", {
              state: {
                initialPrompt: `Hãy hướng dẫn tôi thực hiện bước: "${subtask.title}" thuộc công việc "${task?.title ?? ""}".`,
              },
            });
          }}
          onStatusChange={onSubtaskStatusChange}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Space direction="vertical">
            <RobotOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
            <Text type="secondary">Chưa có AI Breakdown</Text>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={breakdownLoading}
              onClick={onRegenerate}
            >
              Tạo AI Breakdown
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};
