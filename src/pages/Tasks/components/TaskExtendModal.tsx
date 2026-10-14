import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  message,
  Divider,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import type { TaskItem } from "../types";
import {
  extendTaskDeadline,
  reviewTaskExtension,
} from "../../../services/taskServices";

const { Text } = Typography;
const { TextArea } = Input;

interface TaskExtendModalProps {
  open: boolean;
  task: TaskItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const TaskExtendModal: React.FC<TaskExtendModalProps> = ({
  open,
  task,
  onCancel,
  onSuccess,
}) => {
  const { user } = useSelector((state: any) => state.auth);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const currentUserId = user?._id || user?.id;

  const isTeamTask = Boolean(task?.teamId || task?.teamAssignment?.teamId);

  // Người dùng là người giao việc (assignedBy)
  const isAssignedByMe = Boolean(
    isTeamTask &&
      task?.teamAssignment?.assignedBy &&
      String(task.teamAssignment.assignedBy) === String(currentUserId)
  );

  // Có yêu cầu gia hạn đang chờ duyệt hay không
  const pendingExtension =
    task?.extensionRequest && task.extensionRequest.status === "pending"
      ? task.extensionRequest
      : null;

  // Người dùng là người đã gửi yêu cầu
  const isRequester = Boolean(
    pendingExtension &&
      String(pendingExtension.requestedBy) === String(currentUserId)
  );

  // Khởi tạo giá trị form
  useEffect(() => {
    if (open && task) {
      form.resetFields();
      const initialDate = task.dueDate || task.deadline || task.scheduledTime?.end;
      const baseDayjs = initialDate && dayjs(initialDate).isValid()
        ? dayjs(initialDate).add(1, "day")
        : dayjs().add(1, "day").hour(18).minute(0);

      form.setFieldsValue({
        newDeadline: baseDayjs,
        reason: "",
      });
    }
  }, [open, task]);

  if (!task) return null;

  const currentDeadlineStr = task.dueDate || task.deadline || task.scheduledTime?.end;
  const isTaskOverdue = Boolean(
    task.isOverdue ||
      (currentDeadlineStr &&
        dayjs(currentDeadlineStr).isBefore(dayjs()) &&
        task.status !== "completed" &&
        task.status !== "cancelled")
  );

  // Xử lý gửi gia hạn / yêu cầu gia hạn
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const newDeadlineIso = values.newDeadline.toISOString();

      const res = await extendTaskDeadline(task.id, newDeadlineIso, values.reason);
      message.success(res.message || "Đã xử lý gia hạn công việc");
      onSuccess();
      onCancel();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "Không thể thực hiện gia hạn");
    } finally {
      setSubmitting(false);
    }
  };

  // Trưởng nhóm duyệt hoặc từ chối yêu cầu
  const handleReview = async (action: "approve" | "reject") => {
    try {
      setReviewing(true);
      const res = await reviewTaskExtension(task.id, action);
      message.success(res.message || (action === "approve" ? "Đã duyệt gia hạn" : "Đã từ chối gia hạn"));
      onSuccess();
      onCancel();
    } catch (err: any) {
      message.error(err?.message || "Lỗi xử lý yêu cầu gia hạn");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={560}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#f59e0b", fontSize: 20 }} />
          <span>
            {!isTeamTask
              ? "Gia hạn công việc cá nhân"
              : isAssignedByMe
              ? "Gia hạn công việc nhóm (Trưởng nhóm / Chủ dự án)"
              : "Yêu cầu gia hạn công việc nhóm"}
          </span>
        </Space>
      }
    >
      <div style={{ marginTop: 12 }}>
        {/* Thông tin công việc */}
        <div
          style={{
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            marginBottom: 16,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Công việc:
          </Text>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "2px 0 6px 0" }}>
            {task.title}
          </div>
          <Space size={16} wrap>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Hạn chót hiện tại:{" "}
              <strong style={{ color: isTaskOverdue ? "#ef4444" : "#334155" }}>
                {currentDeadlineStr && dayjs(currentDeadlineStr).isValid()
                  ? dayjs(currentDeadlineStr).format("DD/MM/YYYY HH:mm")
                  : "Chưa thiết lập"}
              </strong>
            </Text>
            {isTaskOverdue && (
              <span
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                ⚠️ Đã quá hạn
              </span>
            )}
          </Space>
        </div>

        {/* Khung hiển thị yêu cầu gia hạn đang chờ duyệt (nếu có) */}
        {pendingExtension && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <Text strong>
                {isRequester
                  ? "Bạn đã gửi yêu cầu gia hạn cho công việc này"
                  : `Yêu cầu gia hạn từ ${pendingExtension.requestedByName}`}
              </Text>
            }
            description={
              <div style={{ marginTop: 6 }}>
                <div>
                  Hạn chót đề xuất:{" "}
                  <strong>
                    {dayjs(pendingExtension.requestedDeadline).format("DD/MM/YYYY HH:mm")}
                  </strong>
                </div>
                {pendingExtension.reason && (
                  <div style={{ marginTop: 4, fontStyle: "italic", color: "#64748b" }}>
                    "Lý do: {pendingExtension.reason}"
                  </div>
                )}
                {isAssignedByMe && !isRequester && (
                  <Space style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      style={{ background: "#10b981", borderColor: "#10b981" }}
                      loading={reviewing}
                      onClick={() => handleReview("approve")}
                    >
                      Phê duyệt gia hạn
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={reviewing}
                      onClick={() => handleReview("reject")}
                    >
                      Từ chối
                    </Button>
                  </Space>
                )}
              </div>
            }
          />
        )}

        {/* Hướng dẫn theo vai trò */}
        {isTeamTask && !isAssignedByMe && !pendingExtension && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Công việc thuộc quản lý Nhóm"
            description="Là thành viên thực hiện, bạn có thể gửi yêu cầu đề xuất gia hạn đến Trưởng nhóm / Người giao việc kèm theo lý do để được phê duyệt."
          />
        )}

        {/* Form gửi gia hạn / yêu cầu gia hạn mới */}
        {(!pendingExtension || isAssignedByMe) && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="newDeadline"
              label="Hạn chót mới mong muốn"
              rules={[
                { required: true, message: "Vui lòng chọn hạn chót mới" },
                {
                  validator: async (_, value) => {
                    if (value && value.isBefore(dayjs())) {
                      return Promise.reject(new Error("Hạn chót mới phải sau thời điểm hiện tại"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                placeholder="Chọn ngày và giờ hạn chót mới"
                style={{ width: "100%" }}
              />
            </Form.Item>

            {isTeamTask && !isAssignedByMe && (
              <Form.Item
                name="reason"
                label="Lý do xin gia hạn thêm thời gian"
                rules={[{ required: true, message: "Vui lòng nhập lý do để Trưởng nhóm xem xét" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="VD: Cần thêm thời gian kiểm thử kỹ lưỡng, phát sinh thêm yêu cầu nghiệp vụ mới..."
                />
              </Form.Item>
            )}

            {!isTeamTask && (
              <Form.Item name="reason" label="Ghi chú gia hạn (Tùy chọn)">
                <Input placeholder="VD: Dời lịch sang cuối tuần để tập trung hoàn thiện..." />
              </Form.Item>
            )}

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button onClick={onCancel}>Hủy</Button>
              <Button
                type="primary"
                icon={isTeamTask && !isAssignedByMe ? <SendOutlined /> : <CalendarOutlined />}
                loading={submitting}
                onClick={handleSubmit}
                style={{
                  background: isTeamTask && !isAssignedByMe ? "#2563eb" : "#f59e0b",
                  borderColor: isTeamTask && !isAssignedByMe ? "#2563eb" : "#f59e0b",
                }}
              >
                {isTeamTask && !isAssignedByMe
                  ? "Gửi yêu cầu gia hạn"
                  : "Xác nhận gia hạn"}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  );
};
