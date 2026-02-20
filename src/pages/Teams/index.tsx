import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { TeamOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "./Teams.scss";

const { Title, Text } = Typography;

function Teams() {
  return (
    <div className="teams-page">
      <main className="teams-main">
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>Nhóm của tôi</Title>
          <Text type="secondary">
            Quản lý thành viên và phân công công việc
          </Text>
        </div>

        <Card className="coming-soon-card">
          <TeamOutlined className="coming-soon-icon" />
          <Title level={4}>Tính năng đang phát triển</Title>
          <Text>Trang quản lý nhóm sẽ sớm được ra mắt với các tính năng:</Text>
          <ul className="feature-list">
            <li>Quản lý thành viên nhóm</li>
            <li>Phân công công việc theo nhóm</li>
            <li>Theo dõi tiến độ công việc</li>
            <li>Chat nhóm tích hợp AI</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}

export default Teams;
