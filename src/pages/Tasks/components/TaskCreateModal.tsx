import React, { useState } from "react";
import { Modal, Form, Input, Select, DatePicker, App } from "antd";
import {
  parseEstimatedDuration,
  parseTimeRange,
  validateFlexibleTime,
  validateFlexibleRange,
} from "../../../utils/timeParser";

const { Option } = Select;

interface TaskCreateModalProps {
  open: boolean;
  onCancel: () => void;
  onCreate: (payload: any) => Promise<boolean>;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  open,
  onCancel,
  onCreate,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const estimatedMinutes = parseEstimatedDuration(values.estimatedDuration);
      const range = parseTimeRange(values.dailyTargetRange);

      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        startAt: values.startAt?.toISOString(),
        deadline: values.deadline?.toISOString(),
        tags:
          values.tags
            ?.split(",")
            .map((t: string) => t.trim())
            .filter(Boolean) || [],
        estimatedDuration: estimatedMinutes,
        dailyTargetDuration: range.dailyTargetDuration,
        dailyTargetMin: range.dailyTargetMin,
      };

      const success = await onCreate(payload);
      if (success) {
        form.resetFields();
        onCancel();
      }
    } catch {
      message.error("Vui lòng kiểm tra lại thông tin nhập!");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="Thêm công việc mới"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={creating}
      okText="Tạo công việc"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="VD: Phân tích database hệ thống" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết công việc..." />
        </Form.Item>
        <Form.Item
          name="priority"
          label="Mức độ ưu tiên"
          initialValue="medium"
        >
          <Select>
            <Option value="low">Thấp</Option>
            <Option value="medium">Trung bình</Option>
            <Option value="high">Cao</Option>
          </Select>
        </Form.Item>
        <Form.Item name="startAt" label="Ngày bắt đầu">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="DD/MM/YYYY HH:mm"
          />
        </Form.Item>
        <Form.Item name="deadline" label="Hạn chót">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="DD/MM/YYYY HH:mm"
          />
        </Form.Item>
        <Form.Item name="tags" label="Tags (phân cách bằng dấu phẩy)">
          <Input placeholder="VD: backend, database, urgent" />
        </Form.Item>
        <Form.Item
          name="estimatedDuration"
          label="Thời gian dự kiến"
          initialValue="1h"
          rules={[
            { required: true, message: "Vui lòng nhập thời gian" },
            { validator: validateFlexibleTime },
          ]}
          tooltip="Hỗ trợ số phút, số giờ linh hoạt: 45m, 17p, 1h20, 1.2h, 90 phút..."
        >
          <Input placeholder="VD: 45m, 17p, 1h15, 1.2h, 90 phút" />
        </Form.Item>
        <Form.Item
          name="dailyTargetRange"
          label="Mục tiêu/ngày (tùy chọn)"
          rules={[{ validator: validateFlexibleRange }]}
          tooltip="Mục tiêu làm việc tối thiểu - tối đa mỗi ngày. Hỗ trợ bất kỳ số phút/giờ: 35m-1h10m, 45p-1h20p, 17m-42m, 1h-2h, hoặc 45m"
        >
          <Input placeholder="VD: 35m-1h10m, 45p-1h20p, 17m-42m, 1h-2h, 45m" suffix="/ngày" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
