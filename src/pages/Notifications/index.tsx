import { Card, Typography, Badge, Avatar, Dropdown } from "antd";
import { Link } from "react-router-dom";
import { BellOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "./Notifications.scss";

const { Title, Text } = Typography;

function Notifications() {
  const userMenuItems = [
    { key: "profile", label: "Hồ sơ" },
    { key: "settings", label: "Cài đặt" },
    { type: "divider" as const },
    { key: "logout", label: "Đăng xuất", danger: true },
  ];

  return (
    <div className="notifications-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">▲</span>
            <span className="logo-text">TaskMind AI</span>
          </div>
          <nav className="main-nav">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/tasks" className="nav-link">Công việc AI</Link>
            <Link to="/teams" className="nav-link">Nhóm</Link>
            <Link to="/calendar" className="nav-link">Lịch</Link>
            <Link to="/notifications" className="nav-link active">
              Thông báo
              <Badge count={5} size="small" style={{ marginLeft: 4 }} />
            </Link>
          </nav>
        </div>
        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-menu">
              <Avatar size="small" style={{ backgroundColor: "#4a90e2" }}>N</Avatar>
              <span className="user-name">Nguyễn Văn A</span>
            </div>
          </Dropdown>
        </div>
      </header>

      {/* Main Content */}
      <main className="notifications-main">
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>Thông báo</Title>
          <Text type="secondary">Quản lý thông báo và nhắc nhở của bạn</Text>
        </div>

        <Card className="coming-soon-card">
          <BellOutlined className="coming-soon-icon" />
          <Title level={4}>Tính năng đang phát triển</Title>
          <Text>Trung tâm thông báo sẽ sớm được ra mắt với các tính năng:</Text>
          <ul className="feature-list">
            <li>Thông báo realtime</li>
            <li>Nhắc nhở deadline thông minh</li>
            <li>Thông báo từ AI assistant</li>
            <li>Cập nhật từ nhóm và công việc</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}

export default Notifications;
