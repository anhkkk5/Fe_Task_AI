import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, DatePicker, App } from "antd";
import dayjs from "dayjs";
import {
  parseEstimatedDuration,
  parseTimeRange,
  minutesToHourString,
} from "../../../utils/timeParser";
import type { TaskItem } from "../types";

const { Option } = Select;

interface TaskEditModalProps {
  open: boolean;
  task: TaskItem | null;
  onCancel: () => void;
  onUpdate: (taskId: string, payload: any) => Promise<boolean>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  open,
  task,
  onCancel,
  onUpdate,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && open) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        priority: task.priority,
        startAt: task.startAt ? dayjs(task.startAt) : null,
        deadline: task.deadline ? dayjs(task.deadline) : null,
        tags: task.tags?.join(", "),
        estimatedDuration: task.estimatedDuration
          ? minutesToHourString(task.estimatedDuration)
          : "",
        dailyTargetRange:
          task.dailyTargetDuration && task.dailyTargetMin
            ? `${minutesToHourString(task.dailyTargetMin)}-${minutesToHourString(task.dailyTargetDuration)}`
            : "",
      });
    }
  }, [task, open, form]);

  const handleFinish = async (values: any) => {
    if (!task) return;
    setLoading(true);

    try {
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

      const success = await onUpdate(task.id, payload);
      if (success) {
        onCancel();
      }
    } catch {
      message.error("Cập nhật công việc thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa công việc"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        onFinish={handleFinish}
      >
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
        <Form.Item name="priority" label="Mức độ ưu tiên">
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
        <Form.Item name="estimatedDuration" label="Thời gian dự kiến">
          <Input placeholder="VD: 11h, 2h30, 2.5h, 1h30" suffix="giờ" />
        </Form.Item>
        <Form.Item
          name="dailyTargetRange"
          label="Mục tiêu/ngày"
          tooltip="Nhập khoảng thời gian tối thiểu - tối đa mỗi ngày. VD: 2h-2.5h"
        >
          <Input placeholder="VD: 2h-2.5h, 2h30-3h30, 1h-2h" suffix="/ngày" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
