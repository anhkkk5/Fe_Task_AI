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
} from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./AITaskScheduler.scss";

const { Title, Text, Paragraph } = Typography;

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  aiAssisted?: boolean;
}

interface ScheduleDay {
  day: string;
  date: string;
  tasks: {
    taskId: string;
    title: string;
    priority: string;
    suggestedTime: string;
    reason: string;
  }[];
}

interface ScheduleResult {
  schedule: ScheduleDay[];
  totalTasks: number;
  suggestedOrder: string[];
  personalizationNote?: string;
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
    const incompleteTasks = tasks
      .filter((t) => t.status !== "done")
      .slice(0, 10)
      .map((t) => t.id);
    setSelectedTasks(incompleteTasks);
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
      // Prepare schedule data to save
      const scheduleData: {
        taskId: string;
        date: string;
        suggestedTime: string;
        reason: string;
      }[] = [];

      schedule.schedule.forEach((day) => {
        day.tasks.forEach((task) => {
          scheduleData.push({
            taskId: task.taskId,
            date: day.date,
            suggestedTime: task.suggestedTime,
            reason: task.reason,
          });
        });
      });

      const { saveAISchedule } = await import("../../services/aiServices");
      const result = await saveAISchedule(scheduleData);

      message.success(
        result.message || `Đã cập nhật lịch cho ${result.updated} công việc`,
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

  const incompleteTasks = tasks.filter((t) => t.status !== "done");

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
                            <Tooltip title={task.reason}>
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
