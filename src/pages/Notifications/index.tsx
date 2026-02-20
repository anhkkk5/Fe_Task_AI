import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { BellOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "./Notifications.scss";

const { Title, Text } = Typography;

function Notifications() {
  return (
    <div className="notifications-page">
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
