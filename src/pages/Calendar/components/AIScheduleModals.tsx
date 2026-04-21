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
  Progress,
} from "antd";
import {
  BulbOutlined,
  SyncOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type {
  AIScheduleResponse,
  TaskEstimationMeta,
} from "../../../services/aiServices";

const { Text } = Typography;

const methodLabel: Record<string, { text: string; color: string }> = {
  user: { text: "Người dùng", color: "green" },
  ai: { text: "AI", color: "purple" },
  heuristic: { text: "Heuristic", color: "orange" },
  hybrid: { text: "AI + Heuristic", color: "blue" },
  default: { text: "Mặc định", color: "default" },
};

const difficultyLabel: Record<string, { text: string; color: string }> = {
  easy: { text: "Dễ", color: "green" },
  medium: { text: "Trung bình", color: "orange" },
  hard: { text: "Khó", color: "red" },
};

const EstimationBadge: React.FC<{ meta: TaskEstimationMeta }> = ({ meta }) => {
  const ml = methodLabel[meta.method] || methodLabel.default;
  return (
    <Tooltip
      title={
        <div>
          <div>Phương pháp: {ml.text}</div>
          <div>Độ tin cậy: {Math.round(meta.confidence * 100)}%</div>
          <div>Thời lượng: {meta.finalDuration} phút</div>
          <div>Mục tiêu/ngày: {meta.finalDailyTarget} phút</div>
          {meta.aiDifficulty && (
            <div>
              AI đánh giá: {difficultyLabel[meta.aiDifficulty]?.text} (×
              {meta.aiMultiplier})
            </div>
          )}
          {meta.estimatedFields.length > 0 && (
            <div>Tự động ước tính: {meta.estimatedFields.join(", ")}</div>
          )}
        </div>
      }
    >
      <Tag
        color={ml.color}
        icon={<ExperimentOutlined />}
        style={{ fontSize: 11, cursor: "pointer" }}
      >
        {ml.text} ({Math.round(meta.confidence * 100)}%)
      </Tag>
    </Tooltip>
  );
};

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

          {/* Estimation metadata summary */}
          {aiSchedule.estimationMetadata &&
            aiSchedule.estimationMetadata.length > 0 && (
              <Alert
                type="info"
                showIcon
                icon={<ExperimentOutlined />}
                style={{ marginBottom: 16 }}
                message={
                  <div>
                    <Text strong>
                      Đã tự động ước tính thời lượng cho{" "}
                      {aiSchedule.estimationMetadata.length} task:
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {aiSchedule.estimationMetadata.map((meta) => (
                        <div
                          key={meta.taskId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <ClockCircleOutlined />
                          <Text style={{ minWidth: 120 }}>
                            {meta.finalDuration} phút
                          </Text>
                          <EstimationBadge meta={meta} />
                          <Progress
                            percent={Math.round(meta.confidence * 100)}
                            size="small"
                            style={{ width: 80 }}
                            strokeColor={
                              meta.confidence >= 0.7
                                ? "#52c41a"
                                : meta.confidence >= 0.5
                                  ? "#faad14"
                                  : "#f5222d"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                }
              />
            )}

          {/* Feasibility warnings */}
          {aiSchedule.warnings && aiSchedule.warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
              message={
                <div>
                  <Text strong>Cảnh báo khả thi:</Text>
                  {aiSchedule.warnings.map((w, i) => (
                    <div key={i} style={{ marginTop: 4 }}>
                      <Text type="warning">
                        ⚠ {w.title}: {w.message}
                      </Text>
                    </div>
                  ))}
                </div>
              }
            />
          )}

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
                {day.tasks.map((task, tidx) => {
                  const estMeta = aiSchedule.estimationMetadata?.find(
                    (m) => m.taskId === task.taskId,
                  );
                  return (
                    <div key={tidx} className="ai-task-item">
                      <Tag color="blue">{task.suggestedTime}</Tag>
                      <Text strong>{task.title}</Text>
                      <Tag color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Tag>
                      {estMeta && <EstimationBadge meta={estMeta} />}
                      <Tooltip title={task.reason}>
                        <BulbOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      </Tooltip>
                    </div>
                  );
                })}
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
