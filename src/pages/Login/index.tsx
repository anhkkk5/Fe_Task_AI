import { useState } from "react";
import { Form, Input, Button, message, Divider } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  AppleOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { loginUser } from "../../services/authServices";
import { checkLogin } from "../../actions/login";
import "./Login.scss";

interface LoginFormData {
  email: string;
  password: string;
}

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      await loginUser({
        email: values.email,
        password: values.password,
      });

      dispatch(checkLogin(true));
      messageApi.success("Đăng nhập thành công!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Email hoặc mật khẩu không đúng!";
      messageApi.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-page">
        {contextHolder}
        {/* Left side - Image */}
        <div className="login-left">
          <div className="illustration-content">
            <div className="logo-section-center">
              <span className="logo-icon-xl">▲</span>
              <span className="logo-text-xl">TaskMind AI</span>
            </div>

            <div className="login-image-caption">
              <h2>Quản lý công việc thông minh</h2>
              <p>
                Đăng nhập để trải nghiệm sức mạnh của AI trong việc quản lý công
                việc và tăng năng suất làm việc của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="login-header">
              <h1 className="login-title">Chào mừng trở lại</h1>
              <p className="login-subtitle">
                Vui lòng nhập thông tin đăng nhập của bạn
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  placeholder="name@example.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={
                  <div className="password-label">
                    <span>Mật khẩu</span>
                    <Link to="/forgot-password" className="forgot-link">
                      Quên mật khẩu?
                    </Link>
                  </div>
                }
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu!" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="••••••••"
                  size="large"
                  iconRender={(visible: boolean) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="login-button"
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <Divider className="divider">
              <span className="divider-text">HOẶC</span>
            </Divider>

            <div className="social-login">
              <Button
                block
                size="large"
                className="social-button google"
                icon={<GoogleOutlined />}
              >
                Tiếp tục với Google
              </Button>
              <Button
                block
                size="large"
                className="social-button apple"
                icon={<AppleOutlined />}
              >
                Tiếp tục với Apple
              </Button>
            </div>

            <p className="register-link">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
