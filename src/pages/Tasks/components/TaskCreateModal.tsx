import React, { useState } from "react";
import { Modal, Form, Input, Select, DatePicker, App } from "antd";
import {
  parseEstimatedDuration,
  parseTimeRange,
  timeRegex,
  rangeRegex,
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
          initialValue="11h"
          rules={[
            { required: true, message: "Vui lòng nhập thời gian" },
            {
              pattern: timeRegex,
              message: "Định dạng: 11h, 2h30, 2.5h",
            },
          ]}
        >
          <Input placeholder="VD: 11h, 2h30, 2.5h, 1h30" suffix="giờ" />
        </Form.Item>
        <Form.Item
          name="dailyTargetRange"
          label="Mục tiêu/ngày"
          initialValue="2h-2.5h"
          rules={[
            { required: true, message: "Vui lòng nhập mục tiêu" },
            {
              pattern: rangeRegex,
              message: "VD: 2h-3h, 2h30-3h, 2.5h-3h",
            },
          ]}
          tooltip="Nhập khoảng thời gian tối thiểu - tối đa mỗi ngày. VD: 2h-2.5h"
        >
          <Input placeholder="VD: 2h-2.5h, 2h30-3h30, 1h-2h" suffix="/ngày" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
