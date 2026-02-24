import { useEffect } from "react";
import { Card, Typography, List, Button, Badge, Empty, Spin } from "antd";
import { Link } from "react-router-dom";
import {
  BellOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "../../reducers/notifications";
import "./Notifications.scss";

const { Title, Text } = Typography;

function Notifications() {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(
    (state: any) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications() as any);
  }, [dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id) as any);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead() as any);
  };

  const handleDelete = (id: string) => {
    dispatch(removeNotification(id) as any);
  };

  return (
    <div className="notifications-page">
      <main className="notifications-main">
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>
            Thông báo <Badge count={unreadCount} />
          </Title>
          <Text type="secondary">Quản lý thông báo và nhắc nhở của bạn</Text>
        </div>

        {items.length > 0 && (
          <div className="notifications-actions">
            <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        )}

        <Card className="notifications-list-card">
          <Spin spinning={loading}>
            {items.length === 0 ? (
              <Empty
                description="Không có thông báo nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={items}
                renderItem={(item: any) => (
                  <List.Item
                    className={`notification-item ${!item.isRead ? "unread" : ""}`}
                    actions={[
                      !item.isRead && (
                        <Button
                          key="read"
                          type="text"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkAsRead(item._id || item.id)}
                        />
                      ),
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item._id || item.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<BellOutlined className="notification-icon" />}
                      title={
                        <span className={!item.isRead ? "unread-title" : ""}>
                          {item.title}
                        </span>
                      }
                      description={
                        <div>
                          <Text>{item.message}</Text>
                          <br />
                          <Text type="secondary" className="notification-time">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </Card>
      </main>
    </div>
  );
}

export default Notifications;
