import { useState } from "react";
import {
  Modal,
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Alert,
  List,
  message,
  Timeline,
} from "antd";
import {
  WarningOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface ScheduleConflict {
  taskId: string;
  taskTitle: string;
  conflictingWith: {
    id: string;
    title: string;
    scheduledTime: { start: Date; end: Date };
  }[];
}

interface ScheduleConflictModalProps {
  visible: boolean;
  onClose: () => void;
  conflicts: ScheduleConflict[];
  onConfirm: () => void;
  onReschedule: () => void;
}

export default function ScheduleConflictModal({
  visible,
  onClose,
  conflicts,
  onConfirm,
  onReschedule,
}: ScheduleConflictModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      onConfirm();
      message.success("Đã áp dụng lịch trình");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    onReschedule();
    onClose();
  };

  const formatTime = (date: Date) => {
    return dayjs(date).format("HH:mm");
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format("DD/MM/YYYY");
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: "#faad14" }} />
          <span>Phát hiện xung đột lịch trình</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={650}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Quay lại chỉnh sửa
        </Button>,
        <Button key="reschedule" onClick={handleReschedule}>
          Tạo lại lịch
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleConfirm}
        >
          Vẫn áp dụng
        </Button>,
      ]}
    >
      <Alert
        message="Có xung đột trong lịch trình"
        description="Một số công việc trong lịch AI đề xuất bị trùng giờ với công việc đã có hoặc với nhau. Vui lòng xem xét trước khi áp dụng."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <List
        dataSource={conflicts}
        renderItem={(conflict) => (
          <List.Item>
            <Card
              style={{ width: "100%" }}
              size="small"
              title={
                <Space>
                  <Text strong>{conflict.taskTitle}</Text>
                  <Tag color="error">Xung đột</Tag>
                </Space>
              }
            >
              <Text type="secondary">Trùng giờ với:</Text>
              <Timeline style={{ marginTop: 8 }}>
                {conflict.conflictingWith.map((item) => (
                  <Timeline.Item
                    key={item.id}
                    dot={<ClockCircleOutlined style={{ color: "#ff4d4f" }} />}
                  >
                    <Space direction="vertical" size="small">
                      <Text>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <CalendarOutlined />{" "}
                        {formatDate(item.scheduledTime.start)}{" "}
                        <ClockCircleOutlined />{" "}
                        {formatTime(item.scheduledTime.start)} -{" "}
                        {formatTime(item.scheduledTime.end)}
                      </Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </List.Item>
        )}
      />

      <Alert
        message="Lưu ý"
        description="Nếu bạn vẫn áp dụng lịch này, các công việc sẽ được lưu với thời gian trùng lặp. Bạn nên tạo lại lịch hoặc điều chỉnh thủ công."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
}
