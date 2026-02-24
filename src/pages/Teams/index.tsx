import { useEffect, useState } from "react";
import { Card, Avatar, Button, List, Typography, Tag, Spin, Empty } from "antd";
import { UserOutlined, PlusOutlined, MailOutlined } from "@ant-design/icons";
import { getUsers } from "../../services/userServices";
import type { User } from "../../services/userServices";
import "./Teams.scss";

const { Title, Text } = Typography;

function Teams() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "red";
      case "manager":
        return "blue";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Quản lý";
      default:
        return "Thành viên";
    }
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <Title level={2}>Nhóm & Thành viên</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Mời thành viên
        </Button>
      </div>

      <Card>
        <Spin spinning={loading}>
          {users.length === 0 ? (
            <Empty description="Chưa có thành viên nào" />
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={users}
              renderItem={(user) => (
                <List.Item>
                  <Card className="member-card" hoverable>
                    <div className="member-avatar">
                      <Avatar
                        size={80}
                        src={user.avatar}
                        icon={<UserOutlined />}
                      />
                    </div>
                    <div className="member-info">
                      <Title level={5}>{user.name}</Title>
                      <Text type="secondary">{user.email}</Text>
                      <Tag color={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Tag>
                    </div>
                    <div className="member-actions">
                      <Button
                        type="text"
                        icon={<MailOutlined />}
                        href={`mailto:${user.email}`}
                      >
                        Liên hệ
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}

export default Teams;
