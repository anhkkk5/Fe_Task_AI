import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Avatar,
  Switch,
  message,
  Select,
  Spin,
} from "antd";
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  GlobalOutlined,
  StarOutlined,
  MailOutlined,
  PhoneOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  updateProfile,
  uploadAvatar,
  getMe,
} from "../../services/authServices";
import ImageUpload from "../../components/ImageUpload";
import { ChangePasswordModal } from "../../components/ChangePasswordModal";
import UserHabitsSettings from "../../components/UserHabitsSettings";
import "./Profile.scss";

const { Option } = Select;

function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.loginReducer);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [activeMenu, setActiveMenu] = useState("profile");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Fetch user data on mount and set form values
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getMe();
        // Backend returns { accessToken, user }, extract user only
        const userData = response.user || response;
        dispatch({
          type: "UPDATE_USER",
          payload: userData,
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [dispatch]);

  // Set form values when user data changes
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        position: user.position || "",
        language: "vi",
        timezone: "GMT+07:00",
      });
    }
  }, [user, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updatedUser = await updateProfile({
        name: values.name,
        avatar: user?.avatar,
      });
      dispatch({
        type: "UPDATE_USER",
        payload: updatedUser.user || updatedUser,
      });
      message.success("Cập nhật hồ sơ thành công!");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Hồ sơ" },
    { key: "notifications", icon: <BellOutlined />, label: "Thông báo" },
    { key: "security", icon: <LockOutlined />, label: "Bảo mật" },
    { key: "subscription", icon: <CreditCardOutlined />, label: "Đăng ký" },
  ];

  if (initialLoading) {
    return (
      <div className="profile-page loading">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">▲</div>
            <span className="logo-text">TaskMind AI</span>
          </div>
        </div>

        <div className="user-info">
          <Avatar size={48} src={user?.avatar} icon={<UserOutlined />} />
          <div className="user-details">
            <div className="user-name">{user?.name || "Người dùng"}</div>
            <div className="user-email">{user?.email || ""}</div>
          </div>
        </div>

        <div className="sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`menu-item ${activeMenu === item.key ? "active" : ""}`}
              onClick={() => setActiveMenu(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="menu-item logout">
            <LogoutOutlined />
            <span>Đăng xuất</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Header */}
        <div className="profile-header">
          <div className="header-title">
            <h1>Hồ sơ cá nhân</h1>
            <p>Quản lý thông tin cá nhân và tùy chọn AI của bạn.</p>
          </div>
          <div className="header-actions">
            <Button onClick={() => setChangePasswordOpen(true)}>
              Đổi mật khẩu
            </Button>
            <Button onClick={() => form.resetFields()}>Hủy</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            position: user?.position || "",
            language: "vi",
            timezone: "GMT+07:00",
          }}
        >
          {/* Avatar Card */}
          <div className="profile-card avatar-card">
            <ImageUpload
              value={user?.avatar}
              onChange={(url) => {
                dispatch({
                  type: "UPDATE_USER",
                  payload: { avatar: url },
                });
              }}
              onUpload={uploadAvatar}
              size={80}
              shape="circle"
              placeholder="Tải ảnh lên"
            />
            <div className="avatar-info">
              <h3>{user?.name || "Người dùng"}</h3>
              <p>{user?.email || ""}</p>
            </div>
          </div>

          {/* Basic Info Card */}
          <div className="profile-card">
            <div className="card-header">
              <UserOutlined className="card-icon" />
              <h3>Thông tin cơ bản</h3>
            </div>
            <div className="form-grid">
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item label="Email" name="email">
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phone">
                <Input prefix={<PhoneOutlined />} placeholder="+84 ..." />
              </Form.Item>

              <Form.Item label="Chức vụ" name="position">
                <Input
                  prefix={<ProjectOutlined />}
                  placeholder="Product Manager"
                />
              </Form.Item>
            </div>
          </div>

          {/* Language & Region Card */}
          <div className="profile-card">
            <div className="card-header">
              <GlobalOutlined className="card-icon" />
              <h3>Khu vực & Ngôn ngữ</h3>
            </div>
            <div className="form-grid">
              <Form.Item label="Ngôn ngữ" name="language">
                <Select>
                  <Option value="vi">Tiếng Việt</Option>
                  <Option value="en">English</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Múi giờ" name="timezone">
                <Select>
                  <Option value="GMT+07:00">
                    (GMT+07:00) Bangkok, Hanoi, Jakarta
                  </Option>
                  <Option value="GMT+08:00">
                    (GMT+08:00) Singapore, Kuala Lumpur
                  </Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* AI Configuration Card */}
          <div className="profile-card ai-card">
            <div className="card-header">
              <StarOutlined className="card-icon ai-icon" />
              <div>
                <h3>Cấu hình AI</h3>
                <p>Tùy chỉnh cách TaskMind AI hỗ trợ bạn.</p>
              </div>
            </div>

            <div className="ai-settings">
              <div className="ai-setting-item">
                <div className="setting-info">
                  <h4>Đề xuất AI thông minh</h4>
                  <p>
                    Nhận gợi ý công việc dựa trên thói quen và lịch trình của
                    bạn.
                  </p>
                </div>
                <Switch
                  checked={aiSuggestions}
                  onChange={setAiSuggestions}
                  className="custom-switch"
                />
              </div>

              <div className="ai-setting-item">
                <div className="setting-info">
                  <h4>Tự động lên lịch</h4>
                  <p>
                    Cho phép AI tự động sắp xếp lại các nhiệm vụ chưa hoàn thành
                    vào ngày hôm sau.
                  </p>
                </div>
                <Switch
                  checked={autoSchedule}
                  onChange={setAutoSchedule}
                  className="custom-switch"
                />
              </div>
            </div>
          </div>

          {/* User Habits Settings */}
          <div className="profile-card">
            <UserHabitsSettings userId={user?._id} />
          </div>
        </Form>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}

export default Profile;
