import { useState, useEffect } from "react";
import { Form, Input, Button, message, Spin, Space, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  updateProfile,
  uploadAvatar,
  getMe,
  logoutUser,
} from "../../services/authServices";
import { logout, updateUser } from "../../store/slices/authSlice";
import { clearAccessToken } from "../../utils/axios/request";
import ImageUpload from "../../components/ImageUpload";
import { ChangePasswordModal } from "../../components/ChangePasswordModal";
import UserHabitsSettings from "../../components/UserHabitsSettings";
import "./Profile.scss";

const { Title, Text } = Typography;

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // silent
    } finally {
      clearAccessToken();
      dispatch(logout());
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getMe();
        const userData = response.user || response;
        dispatch(updateUser(userData));
      } catch {
        // silent
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [dispatch]);

  // Gán giá trị form khi dữ liệu người dùng thay đổi
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updatedUser = await updateProfile({
        name: values.name.trim(),
        avatar: user?.avatar,
      });
      dispatch(updateUser(updatedUser.user || updatedUser));
      message.success("Cập nhật thông tin thành công!");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="profile-page loading">
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="header-title">
            <Title level={2} style={{ margin: 0, color: "#1e293b" }}>
              Hồ sơ cá nhân
            </Title>
            <Text type="secondary">
              Quản lý thông tin tài khoản và cấu hình thói quen làm việc AI
            </Text>
          </div>
          <Space className="header-actions">
            <Button
              icon={<LockOutlined />}
              onClick={() => setChangePasswordOpen(true)}
            >
              Đổi mật khẩu
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Space>
        </div>

        {/* Card 1: Thông tin tài khoản & Avatar */}
        <div className="profile-card account-card">
          <div className="card-header">
            <div className="card-icon">
              <UserOutlined />
            </div>
            <div>
              <h3>Thông tin tài khoản</h3>
              <p>Ảnh đại diện và họ tên của bạn trên TaskMind</p>
            </div>
          </div>

          <div className="avatar-section">
            <ImageUpload
              value={user?.avatar}
              onChange={(url) => {
                dispatch({
                  type: "UPDATE_USER",
                  payload: { avatar: url },
                });
              }}
              onUpload={uploadAvatar}
              size={88}
              shape="circle"
              placeholder="Tải ảnh lên"
            />
            <div className="avatar-info">
              <div className="user-display-name">{user?.name || "Người dùng"}</div>
              <div className="user-display-email">{user?.email || ""}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Định dạng hỗ trợ: JPG, PNG hoặc GIF. Tối đa 5MB.
              </Text>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              name: user?.name || "",
              email: user?.email || "",
            }}
            style={{ marginTop: 20 }}
          >
            <div className="form-grid">
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" size="large" />
              </Form.Item>

              <Form.Item label="Email tài khoản" name="email">
                <Input prefix={<MailOutlined />} disabled size="large" />
              </Form.Item>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                htmlType="submit"
                size="large"
              >
                Lưu thông tin
              </Button>
            </div>
          </Form>
        </div>

        {/* Card 2: Thói quen làm việc & Cấu hình AI thực tế */}
        <div className="profile-card habits-card">
          <UserHabitsSettings userId={user?._id} />
        </div>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}

export default Profile;
