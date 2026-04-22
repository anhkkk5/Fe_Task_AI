import { useState } from "react";
import {
  Modal,
  Button,
  Card,
  Checkbox,
  List,
  Tag,
  Typography,
  Space,
  Alert,
  Spin,
  Empty,
  Timeline,
  Divider,
  Badge,
  Tooltip,
  DatePicker,
  message,
  Progress,
} from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type {
  TaskEstimationMeta,
  ScheduleWarning,
} from "../../services/aiServices";
import "./AITaskScheduler.scss";

const { Text } = Typography;

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  aiAssisted?: boolean;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  } | null;
  aiBreakdown?: {
    title: string;
    estimatedDuration?: number;
    difficulty?: "easy" | "medium" | "hard";
    description?: string;
  }[];
}

interface ScheduleDay {
  day: string;
  date: string;
  tasks: {
    sessionId?: string;
    taskId: string;
    title: string;
    priority: string;
    suggestedTime: string;
    reason: string;
    createSubtask?: boolean;
  }[];
}

interface ScheduleResult {
  schedule: ScheduleDay[];
  totalTasks: number;
  suggestedOrder: string[];
  personalizationNote?: string;
  warnings?: ScheduleWarning[];
  estimationMetadata?: TaskEstimationMeta[];
}

interface AITaskSchedulerProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  onScheduleCreate?: (schedule: ScheduleResult) => void;
}

export default function AITaskScheduler({
  visible,
  onClose,
  tasks,
  onScheduleCreate,
}: AITaskSchedulerProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [schedulingStrategy, setSchedulingStrategy] = useState<
    "sequential" | "parallel" | "balanced"
  >("balanced");
  const [distributionPattern, setDistributionPattern] = useState<
    "front-load" | "even" | "adaptive"
  >("adaptive");

  const [applying, setApplying] = useState(false);

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    if (checked) {
      if (selectedTasks.length >= 10) {
        message.warning("Tối đa 10 công việc trong một lịch trình");
        return;
      }
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId));
    }
  };

  const handleSelectAll = () => {
    const canPickTasks = tasks
      .filter((t) => t.status !== "done")
      .filter((t) => t.status !== "scheduled")
      .filter((t) => !t.scheduledTime || t.status === "todo")
      .slice(0, 10)
      .map((t) => t.id);
    setSelectedTasks(canPickTasks);
  };

  const handleGenerateSchedule = async () => {
    if (selectedTasks.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 công việc");
      return;
    }

    setLoading(true);
    try {
      const { aiSchedulePlan } = await import("../../services/aiServices");
      const response = await aiSchedulePlan({
        taskIds: selectedTasks,
        startDate: startDate?.format("YYYY-MM-DD"),
        schedulingStrategy,
        distributionPattern,
      });
      setSchedule(response);
      setCurrentStep(2);
    } catch (error: any) {
      message.error(error?.message || "Lỗi tạo lịch trình. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySchedule = async () => {
    if (!schedule) return;

    setApplying(true);
    try {
      const { saveAISchedule } = await import("../../services/aiServices");
      const result = await saveAISchedule(schedule);

      message.success(
        result.message || `Đã lưu lịch trình với ${result.totalSessions} phiên`,
      );

      if (onScheduleCreate) {
        onScheduleCreate(schedule);
      }
      handleClose();
    } catch (error: any) {
      message.error(error?.message || "Lỗi lưu lịch trình. Vui lòng thử lại!");
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setSelectedTasks([]);
    setSchedule(null);
    setCurrentStep(1);
    setStartDate(dayjs());
    setSchedulingStrategy("balanced");
    setDistributionPattern("adaptive");
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: "default",
      medium: "warning",
      high: "error",
      urgent: "red",
    };
    return map[priority] || "default";
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      urgent: "Khẩn cấp",
    };
    return map[priority] || priority;
  };

  const getScheduleTaskTooltip = (sessionTask: {
    taskId: string;
    reason: string;
  }) => {
    const sourceTask = tasks.find((t) => t.id === sessionTask.taskId);
    const steps = (sourceTask?.aiBreakdown || []).filter((s) => s?.title);

    if (!steps.length) {
      return sessionTask.reason;
    }

    return (
      <div style={{ maxWidth: 380 }}>
        <Text strong style={{ color: "#fff" }}>
          Gợi ý chi tiết từ AI Breakdown
        </Text>
        <div style={{ marginTop: 6 }}>
          {steps.slice(0, 4).map((step, idx) => (
            <div key={`${step.title}-${idx}`} style={{ marginBottom: 6 }}>
              <div>
                {idx + 1}. {step.title}
                {step.estimatedDuration
                  ? ` (${step.estimatedDuration} phút)`
                  : ""}
              </div>
              {step.description && (
                <div style={{ opacity: 0.85, fontSize: 12 }}>
                  {step.description}
                </div>
              )}
            </div>
          ))}
        </div>
        <Divider
          style={{ margin: "8px 0", borderColor: "rgba(255,255,255,0.2)" }}
        />
        <div style={{ opacity: 0.9, fontSize: 12 }}>{sessionTask.reason}</div>
      </div>
    );
  };

  const incompleteTasks = tasks
    .filter((t) => t.status !== "done")
    .filter((t) => t.status !== "scheduled")
    .filter((t) => !t.scheduledTime || t.status === "todo");

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined className="ai-icon" />
          <span>AI Tối Ưu Lịch Làm Việc</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      className="ai-task-scheduler-modal"
    >
      {currentStep === 1 ? (
        <div className="step-1">
          <Alert
            message="AI sẽ phân tích các công việc bạn chọn và tạo lịch trình tối ưu"
            description="Dựa trên deadline, độ ưu tiên và độ phức tạp của công việc"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          <Card
            className="date-card"
            size="small"
            title={<Text strong>Ngày bắt đầu lịch trình</Text>}
          >
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày bắt đầu"
              style={{ width: "100%" }}
              suffixIcon={<CalendarOutlined />}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Card>

          <Card
            className="tasks-selection-card"
            title={
              <Space>
                <Text strong>Chọn công việc</Text>
                <Tag color="blue">{selectedTasks.length}/10</Tag>
              </Space>
            }
            extra={
              <Button type="link" onClick={handleSelectAll}>
                Chọn tất cả
              </Button>
            }
          >
            {incompleteTasks.length === 0 ? (
              <Empty description="Không có công việc nào" />
            ) : (
              <List
                dataSource={incompleteTasks}
                renderItem={(task) => (
                  <List.Item className="task-item">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) =>
                        handleTaskSelect(task.id, e.target.checked)
                      }
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>{task.title}</Text>
                        <Space size={8}>
                          <Tag color={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Tag>
                          <Text type="secondary" className="due-date">
                            <ClockCircleOutlined />
                            {dayjs(task.dueDate).format("DD/MM/YYYY")}
                          </Text>
                        </Space>
                      </Space>
                    </Checkbox>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Chiến lược sắp xếp */}
          {selectedTasks.length > 1 && (
            <Card
              size="small"
              title={<Text strong>Chiến lược sắp xếp</Text>}
              style={{ marginTop: 12 }}
            >
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Khi có nhiều công việc cùng lúc:
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      type={
                        schedulingStrategy === "sequential"
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      onClick={() => setSchedulingStrategy("sequential")}
                    >
                      Tuần tự (xong 1 rồi làm tiếp)
                    </Button>
                    <Button
                      type={
                        schedulingStrategy === "parallel"
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      onClick={() => setSchedulingStrategy("parallel")}
                    >
                      Song song (làm cùng lúc)
                    </Button>
                    <Button
                      type={
                        schedulingStrategy === "balanced"
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      onClick={() => setSchedulingStrategy("balanced")}
                    >
                      Cân bằng (AI gợi ý)
                    </Button>
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Phân bổ thời gian:
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      type={
                        distributionPattern === "adaptive"
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      onClick={() => setDistributionPattern("adaptive")}
                    >
                      Thích ứng (tự động tăng khi gấp)
                    </Button>
                    <Button
                      type={
                        distributionPattern === "front-load"
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      onClick={() => setDistributionPattern("front-load")}
                    >
                      Dồn đầu (làm nhiều ngày đầu)
                    </Button>
                    <Button
                      type={
                        distributionPattern === "even" ? "primary" : "default"
                      }
                      size="small"
                      onClick={() => setDistributionPattern("even")}
                    >
                      Chia đều
                    </Button>
                  </div>
                </div>
              </Space>
            </Card>
          )}

          <div className="modal-footer">
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={loading}
              onClick={handleGenerateSchedule}
              disabled={selectedTasks.length === 0}
            >
              {loading ? "AI đang phân tích..." : "Tạo lịch trình với AI"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="step-2">
          {schedule && (
            <>
              <Alert
                message={`Lịch trình đã sẵn sàng! ${schedule.totalTasks} công việc được sắp xếp trong ${schedule.schedule.length} ngày`}
                description={schedule.personalizationNote}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: 16 }}
              />

              {/* Estimation metadata */}
              {schedule.estimationMetadata &&
                schedule.estimationMetadata.length > 0 && (
                  <Alert
                    type="info"
                    showIcon
                    icon={<ExperimentOutlined />}
                    style={{ marginBottom: 16 }}
                    message={
                      <div>
                        <Text strong>
                          Tự động ước tính cho{" "}
                          {schedule.estimationMetadata.length} task thiếu dữ
                          liệu:
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          {schedule.estimationMetadata.map((meta) => {
                            const task = tasks.find(
                              (t) => t.id === meta.taskId,
                            );
                            return (
                              <div
                                key={meta.taskId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 4,
                                }}
                              >
                                <Text style={{ minWidth: 160 }}>
                                  {task?.title || meta.taskId}
                                </Text>
                                <Tag color="blue">
                                  {meta.finalDuration} phút
                                </Tag>
                                {!meta.estimatedFields?.includes(
                                  "dailyTargetDuration",
                                ) && (
                                  <Tag color="cyan">
                                    {meta.finalDailyTarget} phút/ngày
                                  </Tag>
                                )}
                                <Tooltip
                                  title={`Phương pháp: ${meta.method} | Độ tin cậy: ${Math.round(meta.confidence * 100)}%${meta.aiDifficulty ? ` | AI: ${meta.aiDifficulty}` : ""}`}
                                >
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
                                </Tooltip>
                              </div>
                            );
                          })}
                        </div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, marginTop: 4 }}
                        >
                          Bạn có thể chỉnh sửa thời gian dự kiến và mục
                          tiêu/ngày trong trang Công việc.
                        </Text>
                      </div>
                    }
                  />
                )}

              {/* Feasibility warnings */}
              {schedule.warnings && schedule.warnings.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16 }}
                  message={
                    <div>
                      <Text strong>Cảnh báo:</Text>
                      {schedule.warnings.map((w, i) => (
                        <div key={i} style={{ marginTop: 4 }}>
                          <Text type="warning">
                            ⚠ <strong>{w.title}</strong>: {w.message}
                          </Text>
                        </div>
                      ))}
                    </div>
                  }
                />
              )}

              <div className="schedule-container">
                {schedule.schedule.map((day, index) => (
                  <Card
                    key={index}
                    className="day-card"
                    title={
                      <Space>
                        <Badge
                          count={index + 1}
                          style={{ backgroundColor: "#4a90e2" }}
                        />
                        <Text strong>{day.day}</Text>
                        <Text type="secondary">{day.date}</Text>
                      </Space>
                    }
                  >
                    <Timeline mode="left">
                      {day.tasks.map((task, taskIndex) => (
                        <Timeline.Item
                          key={taskIndex}
                          label={<Tag color="blue">{task.suggestedTime}</Tag>}
                        >
                          <div className="schedule-task">
                            <Text strong>{task.title}</Text>
                            <Tag color={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Tag>
                            <Tooltip title={getScheduleTaskTooltip(task)}>
                              <InfoCircleOutlined className="info-icon" />
                            </Tooltip>
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Card>
                ))}
              </div>

              <Divider />

              <div className="modal-footer">
                <Button onClick={() => setCurrentStep(1)}>Quay lại</Button>
                <Button
                  type="primary"
                  onClick={handleApplySchedule}
                  loading={applying}
                >
                  Áp dụng lịch trình
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <Spin size="large" tip="AI đang phân tích và tối ưu lịch trình..." />
        </div>
      )}
    </Modal>
  );
}
