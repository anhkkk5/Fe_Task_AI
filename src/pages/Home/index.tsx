import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Badge,
  Avatar,
  Dropdown,
  List,
  Typography,
} from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  MoreOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
// import { get } from "../../utils/axios/request";
import "./Home.scss";

const { Title, Text } = Typography;

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "overdue";
  priority: "low" | "medium" | "high";
  dueDate: string;
}

interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

const taskColumns = [
  {
    title: "Công việc",
    dataIndex: "title",
    key: "title",
    render: (text: string, record: Task) => (
      <div className="task-title-cell">
        <Text strong>{text}</Text>
        <br />
        <Text type="secondary" className="task-id">
          #{record.id}
        </Text>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const statusMap: Record<string, { color: string; text: string }> = {
        todo: { color: "default", text: "Chờ xử lý" },
        in_progress: { color: "processing", text: "Đang thực hiện" },
        done: { color: "success", text: "Hoàn thành" },
        overdue: { color: "error", text: "Quá hạn" },
      };
      const { color, text } = statusMap[status] || statusMap.todo;
      return <Tag color={color}>{text}</Tag>;
    },
  },
  {
    title: "Ưu tiên",
    dataIndex: "priority",
    key: "priority",
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
    render: (date: string) => (
      <Text>
        <ClockCircleOutlined style={{ marginRight: 4 }} />
        {new Date(date).toLocaleDateString("vi-VN")}
      </Text>
    ),
  },
  {
    title: "",
    key: "action",
    render: () => <Button type="text" icon={<MoreOutlined />} />,
  },
];

const aiSuggestions = [
  {
    id: 1,
    title: "Phân tích hiệu suất",
    description:
      "Dựa trên dữ liệu của bạn, bạn nên tập trung vào các task quan trọng trước 10h sáng.",
    type: "tip",
  },
  {
    id: 2,
    title: "Gợi ý lịch trình",
    description:
      "Có 2 task đang gần deadline. Bạn có muốn tôi giúp tạo lịch trình phù hợp?",
    type: "action",
  },
];

const upcomingDeadlines = [
  { id: 1, title: "Hoàn thiện báo cáo Q1", dueDate: "2026-02-20", daysLeft: 1 },
  { id: 2, title: "Review code PR #42", dueDate: "2026-02-21", daysLeft: 2 },
  {
    id: 3,
    title: "Meeting với khách hàng",
    dueDate: "2026-02-22",
    daysLeft: 3,
  },
];

function Home() {
  const [stats] = useState<DashboardStats>({
    total: 3,
    inProgress: 1,
    completed: 1,
    overdue: 1,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // const data = await get("/tasks/dashboard");
        // setStats(data.stats);
        // setTasks(data.tasks);
        setTasks([
          {
            id: "TASK-001",
            title: "Thiết kế giao diện mới",
            status: "in_progress",
            priority: "high",
            dueDate: "2026-02-20",
          },
          {
            id: "TASK-002",
            title: "Viết tài liệu API",
            status: "done",
            priority: "medium",
            dueDate: "2026-02-18",
          },
          {
            id: "TASK-003",
            title: "Fix bug đăng nhập",
            status: "overdue",
            priority: "high",
            dueDate: "2026-02-15",
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const userMenuItems = [
    { key: "profile", label: "Hồ sơ" },
    { key: "settings", label: "Cài đặt" },
    { type: "divider" as const },
    { key: "logout", label: "Đăng xuất", danger: true },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">▲</span>
            <span className="logo-text">TaskMind AI</span>
          </div>
          <nav className="main-nav">
            <Link to="/" className="nav-link active">
              Dashboard
            </Link>
            <Link to="/tasks" className="nav-link">
              Công việc AI
            </Link>
            <Link to="/teams" className="nav-link">
              Nhóm
            </Link>
            <Link to="/calendar" className="nav-link">
              Lịch
            </Link>
            <Link to="/notifications" className="nav-link">
              Thông báo
              <Badge count={5} size="small" style={{ marginLeft: 4 }} />
            </Link>
          </nav>
        </div>
        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-menu">
              <Avatar size="small" style={{ backgroundColor: "#4a90e2" }}>
                N
              </Avatar>
              <span className="user-name">Nguyễn Văn A</span>
            </div>
          </Dropdown>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <Title level={2} className="welcome-title">
            Chào mừng Nguyễn Văn A, quản lý công việc của bạn hôm nay thế nào?
          </Title>
        </section>

        <Row gutter={[24, 24]} className="stats-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card total">
              <div className="stat-icon">
                <FolderOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.total}</Text>
                <Text className="stat-label">Tổng công việc</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card in-progress">
              <div className="stat-icon">
                <ClockCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.inProgress}</Text>
                <Text className="stat-label">Đang thực hiện</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card completed">
              <div className="stat-icon">
                <CheckCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.completed}</Text>
                <Text className="stat-label">Hoàn thành</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card overdue">
              <div className="stat-icon">
                <ExclamationCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.overdue}</Text>
                <Text className="stat-label">Quá hạn</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} className="main-grid">
          <Col xs={24} lg={16}>
            <Card
              className="tasks-card"
              title={<Title level={4}>Công việc của tôi</Title>}
              extra={
                <div className="card-actions">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Thêm
                  </Button>
                  <Button type="link">
                    Xem tất cả <ArrowRightOutlined />
                  </Button>
                </div>
              }
            >
              <Table
                columns={taskColumns}
                dataSource={tasks}
                loading={loading}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </Card>

            <Card className="ai-suggestions-card" style={{ marginTop: 24 }}>
              <div className="ai-header">
                <RobotOutlined className="ai-icon" />
                <Title level={5} style={{ margin: 0 }}>
                  Gợi ý từ AI
                </Title>
              </div>
              <List
                dataSource={aiSuggestions}
                renderItem={(item) => (
                  <List.Item className="ai-suggestion-item">
                    <div className="suggestion-content">
                      <Text strong>{item.title}</Text>
                      <br />
                      <Text type="secondary" className="suggestion-desc">
                        {item.description}
                      </Text>
                    </div>
                    {item.type === "action" && (
                      <Button type="primary" size="small">
                        Áp dụng
                      </Button>
                    )}
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card className="quick-actions-card">
              <Title level={5}>Thao tác nhanh</Title>
              <div className="quick-actions">
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<PlusOutlined />}
                >
                  Thêm công việc
                </Button>
                <Button block size="large" icon={<RobotOutlined />}>
                  Yêu cầu AI
                </Button>
                <Button block size="large" icon={<TeamOutlined />}>
                  Mời thành viên
                </Button>
                <Button block size="large" icon={<CalendarOutlined />}>
                  Xem lịch
                </Button>
              </div>
            </Card>

            <Card className="deadlines-card" style={{ marginTop: 24 }}>
              <Title level={5}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Sắp đến hạn
              </Title>
              <List
                dataSource={upcomingDeadlines}
                renderItem={(item) => (
                  <List.Item className="deadline-item">
                    <div className="deadline-info">
                      <Text strong className="deadline-title">
                        {item.title}
                      </Text>
                      <br />
                      <Text type="secondary" className="deadline-date">
                        {item.dueDate}
                      </Text>
                    </div>
                    <Tag color={item.daysLeft <= 1 ? "error" : "warning"}>
                      {item.daysLeft} ngày
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
}

export default Home;
