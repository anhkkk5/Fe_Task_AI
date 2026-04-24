import { useEffect, useState } from "react";
import { Card, Row, Col, Button, Table, Tag, List, Typography } from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  ScheduleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useTasks } from "../../hooks/useTasks";
import { getMe } from "../../services/authServices";
import { useDispatch, useSelector } from "react-redux";
import "./Home.scss";

const { Title, Text } = Typography;

const aiSuggestions: any[] = [];
const upcomingDeadlines: any[] = [];

function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  const { tasks, loading } = useTasks();

  console.log("Home: tasks count:", tasks.length, "loading:", loading);

  const [stats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.name) {
        try {
          const response = await getMe();
          const userData = response.user || response;
          dispatch({ type: "UPDATE_USER", payload: userData });
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      }
    };
    fetchUser();
  }, [dispatch, user]);

  // Table columns
  const columns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <div className="task-title-cell">
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="task-id">
            #{record._id?.slice(-6)}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: "default", text: "Chờ xử lý" },
          in_progress: { color: "processing", text: "Đang thực hiện" },
          completed: { color: "success", text: "Hoàn thành" },
          cancelled: { color: "error", text: "Đã hủy" },
        };
        const { color, text } = map[status] || map.pending;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => {
        const map: Record<string, { color: string; text: string }> = {
          low: { color: "default", text: "Thấp" },
          medium: { color: "warning", text: "Trung bình" },
          high: { color: "error", text: "Cao" },
        };
        const { color, text } = map[priority] || map.low;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (date: string) =>
        date ? (
          <Text>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {new Date(date).toLocaleDateString("vi-VN")}
          </Text>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        {/* Hero 2-col (Smile AI inspired) */}
        <section className="home-hero">
          <div className="home-hero-grid">
            {/* Left: main message */}
            <div className="home-hero-main">
              <span className="home-hero-eyebrow">
                <span className="dot" /> TASKMIND • AI WORKSPACE
              </span>
              <Title level={1} className="home-hero-title">
                Chào {user?.name || "bạn"} — quản lý công việc{" "}
                <span className="accent">thông minh</span>, tập trung vào kết
                quả.
              </Title>
              <Text className="home-hero-desc">
                Lên lịch tự động theo deadline, nhận gợi ý từ AI và theo dõi
                tiến độ trong một bảng điều khiển duy nhất. Mọi thứ bạn cần để
                làm việc hiệu quả hơn mỗi ngày.
              </Text>
              <div className="home-hero-actions">
                <Link to="/tasks">
                  <Button
                    type="primary"
                    size="large"
                    className="home-hero-cta-primary"
                  >
                    Xem công việc <ArrowRightOutlined />
                  </Button>
                </Link>
                <Link to="/guide">
                  <Button size="large" className="home-hero-cta-secondary">
                    <BookOutlined /> Hướng dẫn sử dụng
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: 2 stacked info cards */}
            <div className="home-hero-side">
              <div className="home-hero-info-card">
                <div className="info-card-head">
                  <span className="info-card-icon">
                    <ThunderboltOutlined />
                  </span>
                  <span className="info-card-label">AI TỐI ƯU LỊCH</span>
                </div>
                <h4 className="info-card-title">
                  Tự động phân bổ theo deadline
                </h4>
                <p className="info-card-desc">
                  AI phân chia công việc theo mức độ ưu tiên, thời gian còn lại
                  và khung giờ hiệu quả của bạn — chỉ trong vài giây.
                </p>
              </div>

              <div className="home-hero-info-card">
                <div className="info-card-head">
                  <span className="info-card-icon">
                    <ScheduleOutlined />
                  </span>
                  <span className="info-card-label">NHẮC VIỆC TỨC THÌ</span>
                </div>
                <h4 className="info-card-title">Không bỏ lỡ deadline nào</h4>
                <p className="info-card-desc">
                  Hệ thống chủ động nhắc các công việc sắp đến hạn, phát hiện
                  xung đột lịch và đề xuất điều chỉnh hợp lý.
                </p>
              </div>
            </div>
          </div>
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
                  <Button type="link">
                    Xem tất cả <ArrowRightOutlined />
                  </Button>
                </div>
              }
            >
              <Table
                columns={columns}
                dataSource={tasks}
                loading={loading}
                pagination={false}
                rowKey="_id"
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
