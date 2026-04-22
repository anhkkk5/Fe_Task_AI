import { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Input,
  Select,
  Dropdown,
  Space,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  message,
  Modal,
  Form,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  RobotOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import AITaskScheduler from "../../components/AITaskScheduler";
import StatusDropdown from "../../components/StatusDropdown";
import { AIBreakdownButton } from "../../components/AIBreakdownButton";
import { SubtaskList } from "../../components/SubtaskList";
import { useChatbot } from "../../contexts/ChatbotContext";
import {
  getTaskEstimationExplanation,
  updateSubtaskStatus,
} from "../../services/taskServices";
import type {
  Subtask,
  SubtaskStatus,
  TaskEstimationExplanation,
} from "../../services/taskServices";
import { useTasks } from "../../hooks/useTasks";
import dayjs from "dayjs";
import {
  parseEstimatedDuration,
  parseTimeRange,
  minutesToHourString,
  timeRegex,
  rangeRegex,
} from "../../utils/timeParser";
import "./Tasks.scss";

const { Title, Text } = Typography;
const { Option } = Select;

// Helper: Calculate optimal distribution across days
const calculateDistribution = (
  totalMinutes: number,
  targetRange: { min: number; max: number },
  days: number,
): number[] => {
  // Validate: can we fit within constraints?
  const minTotal = targetRange.min * days;
  const maxTotal = targetRange.max * days;

  if (totalMinutes < minTotal) {
    // Not enough days with current target, use min target
    const base = Math.floor(totalMinutes / days);
    const remainder = totalMinutes % days;
    return Array(days)
      .fill(0)
      .map((_, i) => base + (i < remainder ? 1 : 0));
  }

  if (totalMinutes > maxTotal) {
    // Exceeds max, cap at max per day and extend days
    return Array(days).fill(targetRange.max);
  }

  // Optimal: distribute as evenly as possible within range
  const idealPerDay = Math.floor(totalMinutes / days);

  // Adjust to be within range
  const targetPerDay = Math.max(
    targetRange.min,
    Math.min(idealPerDay, targetRange.max),
  );

  // Calculate distribution
  let remaining = totalMinutes;
  const distribution: number[] = [];

  for (let i = 0; i < days; i++) {
    if (i === days - 1) {
      // Last day takes remainder
      distribution.push(remaining);
    } else {
      const dayMinutes = Math.min(
        targetPerDay +
          (remaining > targetPerDay * (days - i)
            ? targetRange.max - targetPerDay
            : 0),
        remaining - targetRange.min * (days - i - 1), // Ensure remaining days can meet min
      );
      distribution.push(Math.round(dayMinutes));
      remaining -= Math.round(dayMinutes);
    }
  }

  return distribution;
};

interface Task {
  id: string;
  title: string;
  description: string;
  status:
    | "todo"
    | "in_progress"
    | "done"
    | "overdue"
    | "completed"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assignee?: string;
  aiAssisted: boolean;
  tags: string[];
  estimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
}

type ApiTaskStatus =
  | "todo"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type DropdownTaskStatus = "todo" | "scheduled";

const normalizeApiStatus = (apiStatus: string): ApiTaskStatus => {
  if (
    apiStatus === "todo" ||
    apiStatus === "scheduled" ||
    apiStatus === "in_progress" ||
    apiStatus === "completed" ||
    apiStatus === "cancelled"
  ) {
    return apiStatus;
  }

  if (apiStatus === "pending") return "todo";

  return "todo";
};

const toDropdownStatus = (status: string): DropdownTaskStatus => {
  const s = normalizeApiStatus(status);
  if (s === "scheduled") return "scheduled";
  return "todo";
};

const aiSuggestions = [
  {
    id: 1,
    title: "Tự động phân loại",
    description:
      "Tôi có thể giúp phân loại các task theo độ ưu tiên dựa trên deadline.",
    action: "Phân loại ngay",
  },
  {
    id: 2,
    title: "Gợi ý phân công",
    description:
      "Dựa trên khối lượng công việc hiện tại, tôi gợi ý phân công lại 2 task.",
    action: "Xem gợi ý",
  },
];

interface TaskItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  status: "todo" | "scheduled" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  startAt?: string;
  dueDate: string;
  deadline?: string;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  } | null;
  assignee?: string;
  userId?: string;
  aiBreakdown?: any[];
  aiAssisted: boolean;
  tags: string[];
  estimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
  parentTaskId?: string;
  subtasks?: TaskItem[];
  isSubtask?: boolean;
}

function Tasks() {
  const {
    tasks: apiTasks,
    loading,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useTasks();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schedulerVisible, setSchedulerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  // AI Breakdown modal state (riêng biệt)
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownTask, setBreakdownTask] = useState<TaskItem | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [estimationExplain, setEstimationExplain] =
    useState<TaskEstimationExplanation | null>(null);
  const { openWithSubtask } = useChatbot();

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);

  // Handle status change from dropdown
  const handleStatusChange = (taskId: string, newStatus: string) => {
    // Refresh tasks list after status change
    fetchTasks();
  };

  // Define taskColumns inside component to access handleStatusChange
  const taskColumns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: TaskItem) => (
        <div className="task-title-cell">
          <div className="task-title-row">
            <Text strong>{text}</Text>
            {record.aiAssisted && (
              <Tooltip title="AI đã hỗ trợ">
                <RobotOutlined className="ai-badge" />
              </Tooltip>
            )}
          </div>
          <Text type="secondary" className="task-desc">
            {record.description}
          </Text>
          <div className="task-tags">
            {record.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      render: (assignee: string) => (
        <div className="assignee-cell">
          <Avatar size="small" style={{ backgroundColor: "#4a90e2" }}>
            {assignee?.charAt(0) || "?"}
          </Avatar>
          <Text>{assignee || "Chưa gán"}</Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string, record: TaskItem) => {
        // status is already normalized in tasks mapping
        // Just convert to dropdown format (only "todo" or "scheduled")
        const dropdownStatus: "todo" | "scheduled" =
          status === "scheduled" ? "scheduled" : "todo";

        console.log(
          `[StatusDropdown] Task: ${record.title}, DB Status: ${status}, Dropdown Status: ${dropdownStatus}`,
        );

        return (
          <StatusDropdown
            taskId={record.id}
            currentStatus={dropdownStatus}
            onStatusChange={(newStatus) =>
              handleStatusChange(record.id, newStatus)
            }
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
      width: 140,
      render: (date?: string) => {
        if (!date) return <Text type="secondary">-</Text>;
        return (
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {new Date(date).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
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
            {new Date(date).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
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
  ];

  // Handle edit click
  const onEditClick = (task: TaskItem) => {
    setEditingTask(task);
    editForm.setFieldsValue({
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
    setIsEditModalOpen(true);
  };

  // Handle update submit
  const onUpdateSubmit = async (values: any) => {
    if (!editingTask) return;
    setEditLoading(true);

    // Parse time formats to minutes
    const estimatedMinutes = parseEstimatedDuration(values.estimatedDuration);
    const range = parseTimeRange(values.dailyTargetRange);

    // Debug log
    console.log("=== UPDATE TASK DEBUG ===");
    console.log("Form values:", values);
    console.log("estimatedMinutes:", estimatedMinutes);
    console.log("range:", range);

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
    console.log("Payload gửi lên API:", payload);

    const success = await handleUpdate(editingTask.id, payload);

    setEditLoading(false);
    if (success) {
      setIsEditModalOpen(false);
      setEditingTask(null);
    }
  };

  // Handle AI Breakdown modal open
  const onBreakdownClick = async (task: TaskItem) => {
    setBreakdownTask(task);
    setSubtasks((task.aiBreakdown as Subtask[]) ?? []);
    setEstimationExplain(null);
    setIsBreakdownModalOpen(true);

    setExplainLoading(true);
    getTaskEstimationExplanation(task.id)
      .then((res) => setEstimationExplain(res.explanation))
      .catch(() => {
        // silent: không chặn flow breakdown nếu explain fail
      })
      .finally(() => setExplainLoading(false));

    // Nếu chưa có breakdown, tự động trigger luôn
    if (!task.aiBreakdown?.length) {
      setBreakdownLoading(true);
      try {
        const { triggerAiBreakdown } =
          await import("../../services/taskServices");
        const res = await triggerAiBreakdown(task.id);
        setSubtasks((res.task.aiBreakdown as Subtask[]) ?? []);
        fetchTasks();
      } catch (err: any) {
        message.error(
          err?.response?.data?.message || "Không thể tạo AI Breakdown",
        );
      } finally {
        setBreakdownLoading(false);
      }
    }
  };

  // Handle regenerate breakdown
  const onRegenerateBreakdown = async () => {
    if (!breakdownTask) return;
    setBreakdownLoading(true);
    try {
      const { triggerAiBreakdown } =
        await import("../../services/taskServices");
      const res = await triggerAiBreakdown(breakdownTask.id);
      setSubtasks((res.task.aiBreakdown as Subtask[]) ?? []);
      try {
        const explain = await getTaskEstimationExplanation(breakdownTask.id);
        setEstimationExplain(explain.explanation);
      } catch {
        // silent
      }
      fetchTasks();
      message.success("Đã tạo lại AI Breakdown!");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không thể tạo lại AI Breakdown",
      );
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Handle delete click
  const onDeleteClick = (task: TaskItem) => {
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirm
  const onDeleteConfirm = async () => {
    if (!deletingTask) return;
    const success = await handleDelete(deletingTask.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingTask(null);
    }
  };

  // Map API tasks to component format
  const tasks: TaskItem[] = apiTasks
    .filter((t: any) => !(t.parentTaskId && t.scheduledTime?.aiPlanned))
    .map((t: any) => ({
      id: t._id || t.id,
      _id: t._id,
      title: t.title,
      description: t.description || "",
      status: normalizeApiStatus(String(t.status ?? "todo")),
      priority: (t.priority || "medium") as
        | "low"
        | "medium"
        | "high"
        | "urgent",
      startAt: t.startAt || t.teamAssignment?.startAt,
      dueDate: t.deadline || t.dueDate || undefined,
      deadline: t.deadline,
      scheduledTime: t.scheduledTime ?? null,
      assignee: t.userId?.name || "Bạn",
      userId: t.userId,
      aiBreakdown: t.aiBreakdown,
      aiAssisted: !!(t.aiBreakdown && t.aiBreakdown.length > 0),
      tags: t.tags || [],
      estimatedDuration: t.estimatedDuration,
      dailyTargetDuration: t.dailyTargetDuration,
      dailyTargetMin: t.dailyTargetMin,
      parentTaskId: t.parentTaskId,
      isSubtask: !!t.parentTaskId,
    }));

  // Group subtasks under parent tasks
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, TaskItem>();
    const subtasks: TaskItem[] = [];

    // First pass: separate parents and subtasks
    tasks.forEach((task) => {
      if (task.isSubtask && task.parentTaskId) {
        subtasks.push(task);
      } else {
        taskMap.set(task.id, { ...task, subtasks: [] });
      }
    });

    // Second pass: attach subtasks to parents
    subtasks.forEach((subtask) => {
      const parent = taskMap.get(subtask.parentTaskId!);
      if (parent) {
        parent.subtasks!.push(subtask);
      } else {
        // Orphan subtask (parent not found), add as standalone
        taskMap.set(subtask.id, subtask);
      }
    });

    return Array.from(taskMap.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return groupedTasks.filter((task) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.subtasks?.some(
          (st) =>
            st.title.toLowerCase().includes(searchLower) ||
            st.description.toLowerCase().includes(searchLower),
        );
      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter ||
        task.subtasks?.some((st) => st.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [groupedTasks, searchText, statusFilter]);

  // Add action column to taskColumns
  const columnsWithActions = [
    ...taskColumns,
    {
      title: "",
      key: "action",
      width: 80,
      render: (_: any, record: TaskItem) => {
        const items = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Chỉnh sửa",
            onClick: () => onEditClick(record),
          },
          {
            key: "ai-breakdown",
            icon: <RobotOutlined />,
            label: record.aiBreakdown?.length
              ? "Xem AI Breakdown"
              : "AI Breakdown",
            onClick: () => onBreakdownClick(record),
          },
          {
            key: "complete",
            icon: <CheckCircleOutlined />,
            label: "Đánh dấu hoàn thành",
          },
          { type: "divider" as const },
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
    <div className="tasks-page">
      {/* Main Content */}
      <main className="tasks-main">
        {/* Page Header */}
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>Công việc AI</Title>
          <Text type="secondary">
            Quản lý và tối ưu hóa công việc với sự hỗ trợ của AI
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Tasks Table - Full width */}
          <Col xs={24}>
            <Card
              className="tasks-table-card"
              title={
                <Space>
                  <Title level={5} style={{ margin: 0 }}>
                    Danh sách công việc
                  </Title>
                  <Tag>{filteredTasks.length}</Tag>
                </Space>
              }
              extra={
                <Space>
                  <Input
                    placeholder="Tìm kiếm..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 140 }}
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="todo">Chờ xử lý</Option>
                    <Option value="in_progress">Đang thực hiện</Option>
                    <Option value="done">Hoàn thành</Option>
                    <Option value="overdue">Quá hạn</Option>
                  </Select>
                  <Button
                    className="ai-gradient-btn"
                    icon={<ScheduleOutlined />}
                    onClick={() => setSchedulerVisible(true)}
                  >
                    AI Tối Ưu Lịch
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    Thêm công việc
                  </Button>
                </Space>
              }
            >
              <Table
                columns={columnsWithActions}
                dataSource={filteredTasks}
                loading={loading}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
        <AITaskScheduler
          visible={schedulerVisible}
          onClose={() => setSchedulerVisible(false)}
          tasks={tasks}
          onScheduleCreate={(schedule) => {
            console.log("Schedule created:", schedule);
            message.success("Đã tạo lịch trình thành công!");
            // Refresh tasks to show updated status
            fetchTasks();
          }}
        />

        {/* Create Task Modal */}
        <Modal
          title="Thêm công việc mới"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onOk={async () => {
            try {
              const values = await form.validateFields();
              setCreating(true);

              // Parse time formats to minutes
              const estimatedMinutes = parseEstimatedDuration(
                values.estimatedDuration,
              );
              const range = parseTimeRange(values.dailyTargetRange);

              // Debug log
              console.log("=== CREATE TASK DEBUG ===");
              console.log("Form values:", values);
              console.log("estimatedMinutes:", estimatedMinutes);
              console.log("range:", range);

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
              console.log("Payload gửi lên API:", payload);

              const success = await handleCreate(payload);
              if (success) {
                form.resetFields();
                setCreateModalVisible(false);
              }
            } catch (error) {
              console.error("Create task error:", error);
            } finally {
              setCreating(false);
            }
          }}
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
              <Input.TextArea
                rows={3}
                placeholder="Mô tả chi tiết công việc..."
              />
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
              <Input
                placeholder="VD: 2h-2.5h, 2h30-3h30, 1h-2h"
                suffix="/ngày"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          title="Chỉnh sửa công việc"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          onOk={() => editForm.submit()}
          confirmLoading={editLoading}
          okText="Lưu"
          cancelText="Hủy"
        >
          <Form
            form={editForm}
            layout="vertical"
            style={{ marginTop: 16 }}
            onFinish={onUpdateSubmit}
          >
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input placeholder="VD: Phân tích database hệ thống" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea
                rows={3}
                placeholder="Mô tả chi tiết công việc..."
              />
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
            <Form.Item
              name="estimatedDuration"
              label="Thời gian dự kiến"
              rules={[
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
              rules={[
                {
                  pattern: rangeRegex,
                  message: "VD: 2h-3h, 2h30-3h, 2.5h-3h",
                },
              ]}
              tooltip="Nhập khoảng thời gian tối thiểu - tối đa mỗi ngày. VD: 2h-2.5h"
            >
              <Input
                placeholder="VD: 2h-2.5h, 2h30-3h30, 1h-2h"
                suffix="/ngày"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* AI Breakdown Modal — riêng biệt */}
        <Modal
          title={
            <Space>
              <RobotOutlined style={{ color: "#1677ff" }} />
              <span>AI Breakdown: {breakdownTask?.title}</span>
            </Space>
          }
          open={isBreakdownModalOpen}
          onCancel={() => setIsBreakdownModalOpen(false)}
          footer={
            <Space>
              <Button
                icon={<RobotOutlined />}
                loading={breakdownLoading}
                onClick={onRegenerateBreakdown}
              >
                Tạo lại
              </Button>
              <Button
                type="primary"
                onClick={() => setIsBreakdownModalOpen(false)}
              >
                Đóng
              </Button>
            </Space>
          }
          width={600}
        >
          {estimationExplain && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong>AI tính thời lượng như sau</Text>
                <Text type="secondary">
                  Method: {estimationExplain.method} • Confidence:{" "}
                  {Math.round(estimationExplain.confidence * 100)}%
                  {estimationExplain.difficulty
                    ? ` • Difficulty: ${estimationExplain.difficulty}`
                    : ""}
                </Text>
                <Space wrap>
                  {estimationExplain.factors.baseEstimate != null && (
                    <Tag>Base: {estimationExplain.factors.baseEstimate}m</Tag>
                  )}
                  {estimationExplain.factors.priorityMultiplier != null && (
                    <Tag color="orange">
                      Priority ×{estimationExplain.factors.priorityMultiplier}
                    </Tag>
                  )}
                  {estimationExplain.factors.keywordMultiplier != null && (
                    <Tag color="gold">
                      Keyword ×{estimationExplain.factors.keywordMultiplier}
                    </Tag>
                  )}
                  {estimationExplain.factors.aiMultiplier != null && (
                    <Tag color="blue">
                      AI ×{estimationExplain.factors.aiMultiplier}
                    </Tag>
                  )}
                  {estimationExplain.factors.levelMultiplier != null && (
                    <Tag color="cyan">
                      Level ×{estimationExplain.factors.levelMultiplier}
                    </Tag>
                  )}
                  {estimationExplain.factors.historyMultiplier != null && (
                    <Tag color="purple">
                      History ×{estimationExplain.factors.historyMultiplier}
                    </Tag>
                  )}
                </Space>
                <Text>
                  Kết quả: {estimationExplain.result.estimatedDuration} phút •
                  Mục tiêu/ngày {estimationExplain.result.dailyTargetMin}-
                  {estimationExplain.result.dailyTargetDuration} phút
                </Text>
              </Space>
            </Card>
          )}

          {explainLoading && !estimationExplain && (
            <Text type="secondary">Đang tải giải thích ước lượng...</Text>
          )}

          {breakdownLoading && !subtasks.length ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Space direction="vertical">
                <RobotOutlined style={{ fontSize: 32, color: "#1677ff" }} />
                <Text>AI đang phân tích công việc...</Text>
              </Space>
            </div>
          ) : subtasks.length > 0 ? (
            <SubtaskList
              subtasks={subtasks}
              parentTaskTitle={breakdownTask?.title ?? ""}
              onSubtaskClick={(subtask) =>
                openWithSubtask(
                  subtask,
                  breakdownTask?.title ?? "",
                  breakdownTask?.id ?? "",
                  subtasks.indexOf(subtask),
                  {
                    description: breakdownTask?.description,
                    estimatedDuration: breakdownTask?.estimatedDuration,
                    dailyTargetDuration: breakdownTask?.dailyTargetDuration,
                    dailyTargetMin: breakdownTask?.dailyTargetMin,
                  },
                )
              }
              onStatusChange={async (index, status: SubtaskStatus) => {
                const updated = subtasks.map((s, i) =>
                  i === index ? { ...s, status } : s,
                );
                setSubtasks(updated);
                try {
                  await updateSubtaskStatus(breakdownTask!.id, updated);
                } catch {
                  message.error("Không thể cập nhật trạng thái");
                }
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Space direction="vertical">
                <RobotOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
                <Text type="secondary">Chưa có AI Breakdown</Text>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  loading={breakdownLoading}
                  onClick={onRegenerateBreakdown}
                >
                  Tạo AI Breakdown
                </Button>
              </Space>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Xác nhận xóa"
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onOk={onDeleteConfirm}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p>Bạn có chắc muốn xóa công việc "{deletingTask?.title}"?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </Modal>
      </main>
    </div>
  );
}

export default Tasks;
