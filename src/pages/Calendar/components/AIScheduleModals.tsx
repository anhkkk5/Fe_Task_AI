import React from "react";
import {
  Modal,
  Card,
  Button,
  Tag,
  Alert,
  Spin,
  Divider,
  Badge,
  Typography,
  Tooltip,
  Space,
} from "antd";
import {
  BulbOutlined,
  SyncOutlined,
  RobotOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { AIScheduleResponse } from "../../../services/aiServices";

const { Text } = Typography;

interface AISuggestionsPanelProps {
  aiSchedule: AIScheduleResponse | null;
  onViewDetails: () => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  aiSchedule,
  onViewDetails,
}) => {
  if (!aiSchedule) return null;

  return (
    <Card
      className="ai-suggestions-panel"
      title={
        <>
          <BulbOutlined /> Gợi ý lịch từ AI
        </>
      }
    >
      <Alert
        title={aiSchedule.personalizationNote}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div className="ai-schedule-preview">
        {aiSchedule.schedule.slice(0, 3).map((day, idx) => (
          <div key={idx} className="ai-day-preview">
            <Text strong>
              {day.day} ({day.date})
            </Text>
            <div className="ai-tasks-preview">
              {day.tasks.slice(0, 3).map((task, tidx) => (
                <Tag key={tidx} color="blue">
                  {task.suggestedTime}: {task.title}
                </Tag>
              ))}
              {day.tasks.length > 3 && (
                <Tag>+{day.tasks.length - 3} task khác</Tag>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="primary"
        block
        icon={<SyncOutlined />}
        onClick={onViewDetails}
      >
        Xem chi tiết lịch AI
      </Button>
    </Card>
  );
};

interface AIScheduleModalProps {
  open: boolean;
  onCancel: () => void;
  aiSchedule: AIScheduleResponse | null;
  onApply: () => Promise<void>;
  aiApplying: boolean;
}

export const AIScheduleModal: React.FC<AIScheduleModalProps> = ({
  open,
  onCancel,
  aiSchedule,
  onApply,
  aiApplying,
}) => {
  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: "#52c41a",
      medium: "#faad14",
      high: "#f5222d",
      urgent: "#722ed1",
    };
    return map[priority] || "#1890ff";
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined /> Lịch trình tối ưu từ AI
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={aiApplying}
          onClick={onApply}
        >
          Áp dụng lịch trình
        </Button>,
      ]}
    >
      {aiSchedule ? (
        <div className="ai-schedule-modal-content">
          <Alert
            title={`AI đã phân tích ${aiSchedule.totalTasks} công việc và tạo lịch trong ${aiSchedule.schedule.length} ngày`}
            message={aiSchedule.personalizationNote}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          {aiSchedule.schedule.map((day, idx) => (
            <div key={idx} className="ai-day-card">
              <Divider>
                <Badge count={idx + 1} color="#4a90e2" />
                <Text strong style={{ marginLeft: 8 }}>
                  {day.day}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {day.date}
                </Text>
              </Divider>
              <div className="ai-tasks-list">
                {day.tasks.map((task, tidx) => (
                  <div key={tidx} className="ai-task-item">
                    <Tag color="blue">{task.suggestedTime}</Tag>
                    <Text strong>{task.title}</Text>
                    <Tag color={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Tag>
                    <Tooltip title={task.reason}>
                      <BulbOutlined
                        style={{ color: "#faad14", marginLeft: 8 }}
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Spin tip="Đang tải..." />
      )}
    </Modal>
  );
};
