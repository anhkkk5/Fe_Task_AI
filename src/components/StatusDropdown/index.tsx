import React, { useState } from "react";
import { Tag, Dropdown, message } from "antd";
import type { MenuProps } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { patch } from "../../utils/axios/request";
import "./StatusDropdown.scss";

type TaskStatus = "todo" | "scheduled";

interface StatusOption {
  value: TaskStatus;
  label: string;
  color: string;
  icon: React.ReactNode;
}

interface StatusDropdownProps {
  taskId: string;
  currentStatus: TaskStatus;
  onStatusChange?: (newStatus: TaskStatus) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "todo",
    label: "Chưa xử lý",
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  {
    value: "scheduled",
    label: "Đã lên lịch",
    color: "blue",
    icon: <CheckCircleOutlined />,
  },
];

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  taskId,
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === currentStatus || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await patch<{ task: any; message: string }>(
        `/tasks/${taskId}/status`,
        { status: newStatus },
      );

      if (response) {
        message.success(response.message || "Đã cập nhật trạng thái");

        // Callback to parent component
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    } finally {
      setLoading(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find(
    (opt) => opt.value === currentStatus,
  );

  // If status not found in options, default to "todo"
  const displayOption = currentOption || STATUS_OPTIONS[0];

  // Create menu items
  const menuItems: MenuProps["items"] = STATUS_OPTIONS.map((option) => ({
    key: option.value,
    label: (
      <div className="status-menu-item">
        <span className="status-icon">{option.icon}</span>
        <span className="status-label">{option.label}</span>
        {option.value === currentStatus && (
          <CheckCircleOutlined className="status-check" />
        )}
      </div>
    ),
    onClick: () => handleStatusChange(option.value),
    disabled: option.value === currentStatus,
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      disabled={disabled || loading}
      placement="bottomLeft"
    >
      <Tag
        color={displayOption.color}
        icon={loading ? <LoadingOutlined /> : displayOption.icon}
        className="status-dropdown-tag"
        style={{ cursor: disabled || loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Đang cập nhật..." : displayOption.label}
      </Tag>
    </Dropdown>
  );
};

export default StatusDropdown;
