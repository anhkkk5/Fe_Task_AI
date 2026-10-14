import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Avatar,
  Tooltip,
  Dropdown,
  Button,
  Space,
  Popconfirm,
} from "antd";
import type { MenuProps } from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import StatusDropdown from "../../../components/StatusDropdown";
import type { TaskItem } from "../types";

const { Title, Text } = Typography;

interface TaskTableProps {
  tasks: TaskItem[];
  loading: boolean;
  onEditClick: (task: TaskItem) => void;
  onDeleteClick: (task: TaskItem) => void;
  onBreakdownClick: (task: TaskItem) => void;
  onStatusChange: () => void;
  onTaskClick?: (task: TaskItem) => void;
  onExtendClick?: (task: TaskItem) => void;
  onDeleteMany?: (taskIds: string[]) => void;
  onDeleteAll?: () => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onStatusChange,
  onTaskClick,
  onExtendClick,
  onDeleteMany,
  onDeleteAll,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const columns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      width: 260,
      render: (text: string, record: TaskItem) => (
        <div className="task-title-cell">
          <div className="task-title-row">
            <Tooltip
              title={record.description || "Không có mô tả"}
              placement="topLeft"
            >
              <Text
                strong
                className="task-title-text"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onTaskClick ? onTaskClick(record) : onEditClick(record)
                }
              >
                {text}
              </Text>
            </Tooltip>
            {record.aiAssisted && (
              <Tooltip title="AI đã hỗ trợ">
                <RobotOutlined className="ai-badge" />
              </Tooltip>
            )}
          </div>
          <div className="task-tags">
            {record.tags.slice(0, 2).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {record.tags.length > 2 && (
              <Tag>{`+${record.tags.length - 2}`}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      width: 140,
      render: (assignee: string) => (
        <div className="assignee-cell">
          <Avatar size="small" style={{ backgroundColor: "#4a90e2" }}>
            {assignee?.charAt(0) || "?"}
          </Avatar>
          <Text className="assignee-name">{assignee || "Chưa gán"}</Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (_: string, record: TaskItem) => {
        if (record.teamId) {
          return <Tag color="geekblue">Quản lý ở Team</Tag>;
        }

        return <Tag color="default">Cá nhân</Tag>;
      },
    },
    {
      title: "Lên lịch",
      dataIndex: "status",
      key: "scheduleStatus",
      width: 130,
      render: (status: string, record: TaskItem) => {
        const isScheduled =
          status === "scheduled" || Boolean(record.scheduledTime?.start);

        const effectiveDate = record.dueDate || record.deadline || record.scheduledTime?.end;
        const isOverdue = Boolean(
          record.isOverdue ||
          (effectiveDate &&
            new Date(effectiveDate).getTime() < Date.now() &&
            record.status !== "completed" &&
            record.status !== "cancelled")
        );

        if (record.teamId) {
          if (isOverdue) {
            return (
              <Space direction="vertical" size={2}>
                <Tag color="error">Quá hạn</Tag>
                {record.extensionRequest?.status === "pending" && (
                  <Tag color="purple" style={{ fontSize: 10 }}>Chờ gia hạn</Tag>
                )}
              </Space>
            );
          }
          return (
            <Tag color={isScheduled ? "green" : "orange"}>
              {isScheduled ? "Đã lên lịch" : "Chưa xử lý"}
            </Tag>
          );
        }

        const dropdownStatus: "todo" | "scheduled" = isScheduled
          ? "scheduled"
          : "todo";

        return (
          <Space direction="vertical" size={2}>
            <StatusDropdown
              taskId={record.id}
              currentStatus={dropdownStatus}
              onStatusChange={onStatusChange}
            />
            {isOverdue && (
              <Tag color="error" style={{ margin: 0, fontSize: 10, padding: "0 4px" }}>
                Quá hạn
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => {
        const priorityMap: Record<string, { color: string; text: string }> = {
          low: { color: "default", text: "Thấp" },
          medium: { color: "warning", text: "Trung bình" },
          high: { color: "error", text: "Cao" },
        };
        const { color, text } = priorityMap[priority] || priorityMap.low;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startAt",
      key: "startAt",
      width: 130,
      render: (date: string | undefined, record: TaskItem) => {
        const effectiveDate = date || record.scheduledTime?.start;
        if (!effectiveDate) return <Text type="secondary">-</Text>;
        const d = new Date(effectiveDate);
        if (isNaN(d.getTime())) return <Text type="secondary">-</Text>;
        const hasTime = !!record.scheduledTime?.start;
        const timeStr = hasTime
          ? ` ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
          : "";
        return (
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {d.toLocaleDateString("vi-VN")}
            {timeStr}
          </Text>
        );
      },
    },
    {
      title: "Hạn chót",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
      render: (date: string | undefined, record: TaskItem) => {
        const effectiveDate = date || record.deadline || record.scheduledTime?.end;
        if (!effectiveDate) return <Text type="secondary">-</Text>;
        const d = new Date(effectiveDate);
        if (isNaN(d.getTime())) return <Text type="secondary">-</Text>;
        const hasTime = !!record.scheduledTime?.end;
        const timeStr = hasTime
          ? ` ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
          : "";

        const isOverdue = Boolean(
          record.isOverdue ||
          (d.getTime() < Date.now() && record.status !== "completed" && record.status !== "cancelled")
        );

        return (
          <Space direction="vertical" size={2}>
            <Text
              style={
                isOverdue
                  ? { color: "#dc2626", fontWeight: 600 }
                  : undefined
              }
            >
              <CalendarOutlined style={{ marginRight: 4 }} />
              {d.toLocaleDateString("vi-VN")}
              {timeStr}
            </Text>
            {isOverdue && (
              <Tag
                color="error"
                style={{
                  fontSize: 11,
                  margin: 0,
                  padding: "0 6px",
                  cursor: onExtendClick ? "pointer" : "default",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onExtendClick?.(record);
                }}
              >
                Quá hạn ⏱
              </Tag>
            )}
            {record.extensionRequest?.status === "pending" && (
              <Tag
                color="purple"
                style={{
                  fontSize: 11,
                  margin: 0,
                  padding: "0 6px",
                  cursor: onExtendClick ? "pointer" : "default",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onExtendClick?.(record);
                }}
              >
                Chờ duyệt gia hạn
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thời gian dự kiến",
      dataIndex: "estimatedDuration",
      key: "estimatedDuration",
      width: 130,
      render: (minutes: number) => {
        if (!minutes) return <Text type="secondary">-</Text>;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return (
          <Tag color="blue">{mins > 0 ? `${hours}h${mins}` : `${hours}h`}</Tag>
        );
      },
    },
    {
      title: "Mục tiêu/ngày",
      dataIndex: "dailyTargetDuration",
      key: "dailyTargetDuration",
      width: 120,
      render: (maxMinutes: number, record: TaskItem) => {
        if (!maxMinutes) return <Text type="secondary">-</Text>;
        const maxHours = Math.floor(maxMinutes / 60);
        const maxMins = maxMinutes % 60;
        const minMinutes =
          record.dailyTargetMin || Math.floor(maxMinutes * 0.8);
        const minHours = Math.floor(minMinutes / 60);
        const minMins = minMinutes % 60;

        const maxStr = maxMins > 0 ? `${maxHours}h${maxMins}` : `${maxHours}h`;
        const minStr = minMins > 0 ? `${minHours}h${minMins}` : `${minHours}h`;

        return (
          <Tag color="green">
            {minStr}-{maxStr}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_: any, record: TaskItem) => {
        const hasPendingExtension = record.extensionRequest?.status === "pending";
        const items: MenuProps["items"] = [
          {
            key: "extend",
            icon: <ClockCircleOutlined />,
            label: hasPendingExtension
              ? "Xem / Duyệt gia hạn"
              : record.teamId
                ? "Gia hạn / Yêu cầu gia hạn"
                : "Gia hạn hạn chót",
            onClick: () => onExtendClick?.(record),
          },
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Chỉnh sửa",
            onClick: () => onEditClick(record),
          },
          {
            key: "breakdown",
            icon: <RobotOutlined />,
            label: "AI Breakdown",
            onClick: () => onBreakdownClick(record),
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Xóa",
            danger: true,
            onClick: () => onDeleteClick(record),
          },
        ];

        return (
          <Dropdown menu={{ items }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <Card
      className="tasks-table-card"
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Danh sách công việc
          </Title>
          <Tag>{tasks.length}</Tag>
        </Space>
      }
      extra={
        tasks.length > 0 && onDeleteAll ? (
          <Popconfirm
            title="CẢNH BÁO: Xóa tất cả công việc?"
            description="Toàn bộ danh sách công việc cá nhân của bạn sẽ bị xóa sạch và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"
            onConfirm={() => {
              onDeleteAll();
              setSelectedRowKeys([]);
            }}
            okText="Xác nhận xóa tất cả"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa tất cả công việc
            </Button>
          </Popconfirm>
        ) : null
      }
    >
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Space>
            <Text strong style={{ color: "#1e40af" }}>
              Đã chọn {selectedRowKeys.length} / {tasks.length} công việc
            </Text>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              Bỏ chọn
            </Button>
          </Space>

          <Popconfirm
            title={`Xác nhận xóa ${selectedRowKeys.length} công việc đã chọn?`}
            description="Các công việc này sẽ bị xóa khỏi hệ thống. Bạn có chắc chắn không?"
            onConfirm={() => {
              onDeleteMany?.(selectedRowKeys.map(String));
              setSelectedRowKeys([]);
            }}
            okText="Xác nhận xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Xóa {selectedRowKeys.length} công việc đã chọn
            </Button>
          </Popconfirm>
        </div>
      )}

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowKey="id"
        tableLayout="fixed"
        scroll={{ x: 1380 }}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest(".ant-dropdown-trigger") ||
              target.closest(".status-dropdown-wrapper") ||
              target.closest(".ant-btn") ||
              target.closest(".ant-select") ||
              target.closest(".ant-table-selection-column") ||
              target.closest(".ant-checkbox-wrapper")
            ) {
              return;
            }
            if (onTaskClick) {
              onTaskClick(record);
            } else {
              onEditClick(record);
            }
          },
          style: { cursor: "pointer" },
        })}
      />
    </Card>
  );
};
