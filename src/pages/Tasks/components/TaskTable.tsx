import React from "react";
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
} from "antd";
import type { MenuProps } from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
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
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading,
  onEditClick,
  onDeleteClick,
  onBreakdownClick,
  onStatusChange,
  onTaskClick,
}) => {
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
        if (record.teamId) {
          const isScheduled = status === "scheduled";
          return (
            <Tag color={isScheduled ? "green" : "orange"}>
              {isScheduled ? "Đã lên lịch" : "Chưa xử lý"}
            </Tag>
          );
        }

        const dropdownStatus: "todo" | "scheduled" =
          status === "scheduled" ? "scheduled" : "todo";

        return (
          <StatusDropdown
            taskId={record.id}
            currentStatus={dropdownStatus}
            onStatusChange={onStatusChange}
          />
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
      width: 120,
      render: (date?: string) => {
        if (!date) return <Text type="secondary">-</Text>;
        return (
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {new Date(date).toLocaleDateString("vi-VN")}
          </Text>
        );
      },
    },
    {
      title: "Hạn chót",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date?: string) => {
        if (!date) return <Text type="secondary">-</Text>;
        return (
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {new Date(date).toLocaleDateString("vi-VN")}
          </Text>
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
        const items: MenuProps["items"] = [
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
    >
      <Table
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
              target.closest(".ant-select")
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
