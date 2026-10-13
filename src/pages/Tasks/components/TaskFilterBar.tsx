import React from "react";
import { Input, Select, Button, Segmented } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ScheduleOutlined,
  PlusOutlined,
  BarsOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface TaskFilterBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  viewMode: "table" | "kanban";
  onViewModeChange: (mode: "table" | "kanban") => void;
  onOpenScheduler: () => void;
  onOpenCreateModal: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onOpenScheduler,
  onOpenCreateModal,
}) => {
  return (
    <div className="tasks-toolbar">
      <div className="tasks-toolbar-search">
        <Input
          placeholder="Tìm kiếm công việc..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
        />
        {viewMode === "table" && (
          <Select
            value={statusFilter}
            onChange={onStatusFilterChange}
            suffixIcon={<FilterOutlined />}
            className="tasks-toolbar-select"
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="todo">Chờ xử lý</Option>
            <Option value="in_progress">Đang thực hiện</Option>
            <Option value="done">Hoàn thành</Option>
            <Option value="overdue">Quá hạn</Option>
          </Select>
        )}
      </div>

      <div className="tasks-toolbar-actions">
        {/* Nút chuyển đổi View: Bảng vs Kanban */}
        <Segmented
          value={viewMode}
          onChange={(val) => onViewModeChange(val as "table" | "kanban")}
          options={[
            {
              value: "table",
              icon: <BarsOutlined />,
              label: "Danh sách",
            },
            {
              value: "kanban",
              icon: <AppstoreOutlined />,
              label: "Kanban",
            },
          ]}
          style={{ background: "#f1f5f9" }}
        />

        <Button
          className="ai-gradient-btn tasks-toolbar-ai-btn"
          icon={<ScheduleOutlined />}
          onClick={onOpenScheduler}
        >
          <span className="btn-label-full">AI Tối Ưu Lịch</span>
          <span className="btn-label-short">AI Lịch</span>
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onOpenCreateModal}
        >
          <span className="btn-label-full">Thêm công việc</span>
          <span className="btn-label-short">Thêm</span>
        </Button>
      </div>
    </div>
  );
};
