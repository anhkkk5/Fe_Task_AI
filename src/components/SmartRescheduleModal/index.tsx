import { useState } from "react";
import {
  Modal,
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Alert,
  Spin,
  Radio,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface SmartRescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    scheduledTime?: {
      start: string;
      end: string;
    };
  } | null;
  onConfirm: (newSchedule: { start: Date; end: Date; date: string }) => void;
}

interface RescheduleSuggestion {
  suggestion: {
    newStartTime: string;
    newEndTime: string;
    newDate: string;
    reason: string;
    confidence: "high" | "medium" | "low";
  };
  alternativeSlots?: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }[];
  advice: string;
}

export default function SmartRescheduleModal({
  visible,
  onClose,
  task,
  onConfirm,
}: SmartRescheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<RescheduleSuggestion | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<"primary" | number>(
    "primary",
  );

  const fetchRescheduleSuggestion = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const { smartReschedule } = await import("../../services/aiServices");
      const response = await smartReschedule({
        missedTask: {
          id: task.id,
          title: task.title,
          priority: "medium",
          originalScheduledTime: task.scheduledTime
            ? {
                start: new Date(task.scheduledTime.start).toISOString(),
                end: new Date(task.scheduledTime.end).toISOString(),
              }
            : undefined,
        },
        reason: "missed",
      });
      setSuggestion(response);
    } catch (error: any) {
      message.error(error?.message || "Lỗi tạo đề xuất lịch mới");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!suggestion) return;

    let selectedDate: string;
    let startTime: string;
    let endTime: string;

    if (selectedSlot === "primary") {
      selectedDate = suggestion.suggestion.newDate;
      startTime = suggestion.suggestion.newStartTime;
      endTime = suggestion.suggestion.newEndTime;
    } else if (
      suggestion.alternativeSlots &&
      suggestion.alternativeSlots[selectedSlot]
    ) {
      const slot = suggestion.alternativeSlots[selectedSlot];
      selectedDate = slot.date;
      startTime = slot.startTime;
      endTime = slot.endTime;
    } else {
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${startTime}`);
    const endDateTime = new Date(`${selectedDate}T${endTime}`);

    onConfirm({
      start: startDateTime,
      end: endDateTime,
      date: selectedDate,
    });
    handleClose();
  };

  const handleClose = () => {
    setSuggestion(null);
    setSelectedSlot("primary");
    onClose();
  };

  // Fetch suggestion when modal opens
  if (visible && !suggestion && !loading && task) {
    fetchRescheduleSuggestion();
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "success";
      case "medium":
        return "warning";
      case "low":
        return "error";
      default:
        return "default";
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "Độ tin cậy cao";
      case "medium":
        return "Độ tin cậy trung bình";
      case "low":
        return "Độ tin cậy thấp";
      default:
        return "Không xác định";
    }
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined className="ai-icon" />
          <span>AI Đề xuất lịch mới</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={
        suggestion
          ? [
              <Button key="cancel" onClick={handleClose}>
                Hủy
              </Button>,
              <Button
                key="confirm"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
              >
                Áp dụng lịch mới
              </Button>,
            ]
          : null
      }
    >
      {loading && (
        <div
          className="loading-container"
          style={{ textAlign: "center", padding: 40 }}
        >
          <Spin
            size="large"
            tip="AI đang phân tích và đề xuất lịch tối ưu..."
          />
        </div>
      )}

      {!loading && suggestion && (
        <div className="reschedule-content">
          <Alert
            message="Task bị bỏ lỡ"
            description={`"${task?.title}" đã không được thực hiện đúng giờ. AI đã phân tích thói quen của bạn và đề xuất thời gian mới.`}
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>Đề xuất chính</span>
                <Tag
                  color={getConfidenceColor(suggestion.suggestion.confidence)}
                >
                  {getConfidenceText(suggestion.suggestion.confidence)}
                </Tag>
              </Space>
            }
            className="primary-suggestion"
            style={{ marginBottom: 16 }}
          >
            <Radio.Group
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <Radio value="primary">
                <Space direction="vertical" size="small">
                  <Text strong>
                    <CalendarOutlined />{" "}
                    {dayjs(suggestion.suggestion.newDate).format("DD/MM/YYYY")}
                  </Text>
                  <Text>
                    <ClockCircleOutlined /> {suggestion.suggestion.newStartTime}{" "}
                    - {suggestion.suggestion.newEndTime}
                  </Text>
                  <Text type="secondary">{suggestion.suggestion.reason}</Text>
                </Space>
              </Radio>
            </Radio.Group>
          </Card>

          {suggestion.alternativeSlots &&
            suggestion.alternativeSlots.length > 0 && (
              <Card
                title="Khung giờ thay thế"
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Radio.Group
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {suggestion.alternativeSlots.map((slot, index) => (
                      <Radio key={index} value={index}>
                        <Space direction="vertical" size="small">
                          <Text>
                            <CalendarOutlined />{" "}
                            {dayjs(slot.date).format("DD/MM/YYYY")}
                            <ClockCircleOutlined
                              style={{ marginLeft: 8 }}
                            />{" "}
                            {slot.startTime} - {slot.endTime}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {slot.reason}
                          </Text>
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            )}

          <Alert
            message="Lời khuyên từ AI"
            description={suggestion.advice}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )}
    </Modal>
  );
}
