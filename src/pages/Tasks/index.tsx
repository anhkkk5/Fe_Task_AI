import { useState } from "react";
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
import "./Tasks.scss";

const { Title, Text } = Typography;
const { Option } = Select;

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done" | "overdue";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignee?: string;
  aiAssisted: boolean;
  tags: string[];
}

const taskColumns = [
  {
    title: "Công việc",
    dataIndex: "title",
    key: "title",
    render: (text: string, record: Task) => (
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
    render: (status: string) => {
      const statusMap: Record<
        string,
        { color: string; text: string; icon: React.ReactNode }
      > = {
        todo: {
          color: "default",
          text: "Chờ xử lý",
          icon: <ClockCircleOutlined />,
        },
        in_progress: {
          color: "processing",
          text: "Đang thực hiện",
          icon: <ClockCircleOutlined />,
        },
        done: {
          color: "success",
          text: "Hoàn thành",
          icon: <CheckCircleOutlined />,
        },
        overdue: {
          color: "error",
          text: "Quá hạn",
          icon: <ClockCircleOutlined />,
        },
      };
      const { color, text } = statusMap[status] || statusMap.todo;
      return <Tag color={color}>{text}</Tag>;
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
    title: "Hạn chót",
    dataIndex: "dueDate",
    key: "dueDate",
    width: 120,
    render: (date: string) => (
      <Text>
        <CalendarOutlined style={{ marginRight: 4 }} />
        {new Date(date).toLocaleDateString("vi-VN")}
      </Text>
    ),
  },
  {
    title: "",
    key: "action",
    width: 80,
    render: () => {
      const items = [
        { key: "edit", icon: <EditOutlined />, label: "Chỉnh sửa" },
        {
          key: "complete",
          icon: <CheckCircleOutlined />,
          label: "Đánh dấu hoàn thành",
        },
        { type: "divider" as const },
        { key: "delete", icon: <DeleteOutlined />, label: "Xóa", danger: true },
      ];
      return (
        <Dropdown menu={{ items }} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      );
    },
  },
];

const mockTasks: Task[] = [
  {
    id: "TASK-001",
    title: "Thiết kế giao diện mới",
    description: "Tạo mockup cho trang dashboard",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-02-20",
    assignee: "Nguyễn Văn A",
    aiAssisted: true,
    tags: ["UI/UX", "Design"],
  },
  {
    id: "TASK-002",
    title: "Viết tài liệu API",
    description: "Document các endpoint mới",
    status: "done",
    priority: "medium",
    dueDate: "2026-02-18",
    assignee: "Trần Văn B",
    aiAssisted: false,
    tags: ["Docs"],
  },
  {
    id: "TASK-003",
    title: "Fix bug đăng nhập",
    description: "Lỗi không thể đăng nhập với Google",
    status: "overdue",
    priority: "high",
    dueDate: "2026-02-15",
    assignee: "Nguyễn Văn A",
    aiAssisted: true,
    tags: ["Bug", "Priority"],
  },
  {
    id: "TASK-004",
    title: "Tích hợp AI chat",
    description: "Thêm tính năng chat với AI assistant",
    status: "todo",
    priority: "medium",
    dueDate: "2026-02-25",
    assignee: "Lê Văn C",
    aiAssisted: true,
    tags: ["AI", "Feature"],
  },
];

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

function Tasks() {
  const [tasks] = useState<Task[]>(mockTasks);
  const [loading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schedulerVisible, setSchedulerVisible] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          {/* Left - Tasks Table */}
          <Col xs={24} lg={16}>
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
                    type="primary"
                    icon={<ScheduleOutlined />}
                    onClick={() => setSchedulerVisible(true)}
                  >
                    AI Tối Ưu Lịch
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm công việc
                  </Button>
                </Space>
              }
            >
              <Table
                columns={taskColumns}
                dataSource={filteredTasks}
                loading={loading}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </Col>

          {/* Right - AI Sidebar */}
          <Col xs={24} lg={8}>
            {/* AI Assistant Card */}
            <Card className="ai-assistant-card">
              <div className="ai-header">
                <div className="ai-avatar">
                  <RobotOutlined />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Trợ lý AI
                  </Title>
                  <Text type="secondary">Sẵn sàng hỗ trợ bạn</Text>
                </div>
              </div>
              <Button
                type="primary"
                block
                icon={<RobotOutlined />}
                size="large"
              >
                Yêu cầu AI phân tích
              </Button>
            </Card>

            {/* AI Suggestions */}
            <Card className="ai-suggestions-card" style={{ marginTop: 16 }}>
              <Title level={5}>Gợi ý thông minh</Title>
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="suggestion-item">
                  <Text strong>{suggestion.title}</Text>
                  <p className="suggestion-desc">{suggestion.description}</p>
                  <Button type="link" size="small">
                    {suggestion.action}
                  </Button>
                </div>
              ))}
            </Card>

            {/* Quick Stats */}
            <Card className="quick-stats-card" style={{ marginTop: 16 }}>
              <Title level={5}>Thống kê nhanh</Title>
              <div className="stat-item">
                <Text>Công việc AI hỗ trợ</Text>
                <Badge
                  count={tasks.filter((t) => t.aiAssisted).length}
                  style={{ backgroundColor: "#4a90e2" }}
                />
              </div>
              <div className="stat-item">
                <Text>Cần hoàn thành tuần này</Text>
                <Badge count={3} style={{ backgroundColor: "#f59e0b" }} />
              </div>
              <div className="stat-item">
                <Text>Đã hoàn thành hôm nay</Text>
                <Badge count={1} style={{ backgroundColor: "#10b981" }} />
              </div>
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
          }}
        />
      </main>
    </div>
  );
}

export default Tasks;
