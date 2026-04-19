import React, { useState } from "react";
import { Button, message, Space } from "antd";
import { RobotOutlined, ReloadOutlined } from "@ant-design/icons";
import { triggerAiBreakdown } from "../../services/taskServices";
import type { Subtask } from "../../services/taskServices";

interface AIBreakdownButtonProps {
  taskId: string;
  hasExistingBreakdown?: boolean;
  onBreakdownComplete: (subtasks: Subtask[]) => void;
  disabled?: boolean;
}

const AIBreakdownButton: React.FC<AIBreakdownButtonProps> = ({
  taskId,
  hasExistingBreakdown = false,
  onBreakdownComplete,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await triggerAiBreakdown(taskId);
      const subtasks = res.task.aiBreakdown ?? [];
      onBreakdownComplete(subtasks);
      message.success("AI đã tạo xong danh sách bước thực hiện!");
    } catch (err: any) {
      setHasError(true);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo AI breakdown. Vui lòng thử lại.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      <Button
        type={hasExistingBreakdown ? "default" : "primary"}
        icon={hasExistingBreakdown ? <ReloadOutlined /> : <RobotOutlined />}
        loading={loading}
        disabled={disabled}
        onClick={handleClick}
        size="small"
      >
        {hasExistingBreakdown ? "Tạo lại Breakdown" : "AI Breakdown"}
      </Button>
      {hasError && (
        <Button size="small" onClick={handleClick} loading={loading}>
          Thử lại
        </Button>
      )}
    </Space>
  );
};

export default AIBreakdownButton;
