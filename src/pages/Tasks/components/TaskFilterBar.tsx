import React from "react";
import { Input, Select, Button } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ScheduleOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface TaskFilterBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onOpenScheduler: () => void;
  onOpenCreateModal: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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
      </div>
      <div className="tasks-toolbar-actions">
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
