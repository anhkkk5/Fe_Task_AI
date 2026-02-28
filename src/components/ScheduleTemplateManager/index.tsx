import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Tag,
  List,
  Empty,
  message,
  Dropdown,
  Badge,
} from "antd";
import {
  SaveOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  MoreOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ScheduleTemplate } from "../../services/aiServices";

const { Text } = Typography;

interface ScheduleTemplateManagerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (template: ScheduleTemplate) => void;
  onSaveFromSchedule?: (schedule: any) => void;
}

export default function ScheduleTemplateManager({
  visible,
  onClose,
  onApply,
}: ScheduleTemplateManagerProps) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { getScheduleTemplates } =
        await import("../../services/aiServices");
      const response = await getScheduleTemplates();
      setTemplates(response.templates);
    } catch (error: any) {
      message.error(error?.message || "Lỗi tải danh sách template");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (template: ScheduleTemplate) => {
    try {
      const { applyScheduleTemplate } =
        await import("../../services/aiServices");
      await applyScheduleTemplate(template.id);
      message.success(`Đã áp dụng template "${template.name}"`);
      onApply(template);
    } catch (error: any) {
      message.error(error?.message || "Lỗi áp dụng template");
    }
  };

  const handleSetDefault = async (template: ScheduleTemplate) => {
    try {
      const { setDefaultTemplate } = await import("../../services/aiServices");
      await setDefaultTemplate(template.id);
      message.success(`Đã đặt "${template.name}" làm template mặc định`);
      fetchTemplates();
    } catch (error: any) {
      message.error(error?.message || "Lỗi đặt template mặc định");
    }
  };

  const handleDelete = async (template: ScheduleTemplate) => {
    try {
      const { deleteScheduleTemplate } =
        await import("../../services/aiServices");
      await deleteScheduleTemplate(template.id);
      message.success(`Đã xóa template "${template.name}"`);
      fetchTemplates();
    } catch (error: any) {
      message.error(error?.message || "Lỗi xóa template");
    }
  };

  const getDayOfWeekText = (day: number) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[day];
  };

  return (
    <Modal
      title={
        <Space>
          <SaveOutlined />
          <span>Quản lý Template Lịch</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {templates.length === 0 ? (
        <Empty description="Chưa có template nào" style={{ padding: 40 }} />
      ) : (
        <List
          dataSource={templates}
          renderItem={(template) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApply(template)}
                >
                  Áp dụng
                </Button>,
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "default",
                        icon: template.isDefault ? (
                          <StarFilled style={{ color: "#faad14" }} />
                        ) : (
                          <StarOutlined />
                        ),
                        label: template.isDefault ? "Mặc định" : "Đặt mặc định",
                        disabled: template.isDefault,
                        onClick: () => handleSetDefault(template),
                      },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Xóa",
                        danger: true,
                        onClick: () => handleDelete(template),
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Button type="text" icon={<MoreOutlined />} size="small" />
                </Dropdown>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{template.name}</Text>
                    {template.isDefault && (
                      <Badge
                        count="Mặc định"
                        style={{ backgroundColor: "#faad14" }}
                      />
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    {template.description && (
                      <Text type="secondary">{template.description}</Text>
                    )}
                    <Space size="small">
                      {template.pattern.days.map((day) => (
                        <Tag key={day.dayOfWeek}>
                          {getDayOfWeekText(day.dayOfWeek)}:{" "}
                          {day.timeBlocks.length} khung giờ
                        </Tag>
                      ))}
                    </Space>
                    <Space size="small">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> Đã dùng {template.usageCount}{" "}
                        lần
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
