import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { CalendarOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "./Calendar.scss";

const { Title, Text } = Typography;

function Calendar() {
  return (
    <div className="calendar-page">
      {/* Main Content */}
      <main className="calendar-main">
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>Lịch công việc</Title>
          <Text type="secondary">Quản lý thời gian và lịch hẹn của bạn</Text>
        </div>

        <Card className="coming-soon-card">
          <CalendarOutlined className="coming-soon-icon" />
          <Title level={4}>Tính năng đang phát triển</Title>
          <Text>Lịch công việc sẽ sớm được ra mắt với các tính năng:</Text>
          <ul className="feature-list">
            <li>Xem lịch theo ngày, tuần, tháng</li>
            <li>Đồng bộ với Google Calendar</li>
            <li>Reminder thông minh với AI</li>
            <li>Phân tích thời gian làm việc</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}

export default Calendar;
