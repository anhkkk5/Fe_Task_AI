import React from "react";
import { Modal } from "antd";
import type { TaskItem } from "../types";

interface TaskDeleteModalProps {
  open: boolean;
  task: TaskItem | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const TaskDeleteModal: React.FC<TaskDeleteModalProps> = ({
  open,
  task,
  loading,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      title="Xác nhận xóa"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      okText="Xóa"
      cancelText="Hủy"
      okButtonProps={{ danger: true }}
    >
      <p>Bạn có chắc muốn xóa công việc "{task?.title}"?</p>
      <p style={{ color: "#8c8c8c", fontSize: 13 }}>
        Hành động này không thể hoàn tác.
      </p>
    </Modal>
  );
};
