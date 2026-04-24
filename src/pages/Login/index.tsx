import { useState } from "react";
import { Form, Input, Button, message, Divider } from "antd";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  AppleOutlined,
} from "@ant-design/icons";
import { loginUser, getMe } from "../../services/authServices";
import { checkLogin } from "../../store/slices/authSlice";
import { redirectToGoogleAuth } from "../../services/backendGoogleServices";
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
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const redirectPath = searchParams.get("redirect");

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const loginResponse = await loginUser({
        email: values.email,
        password: values.password,
      });

      // Fetch user data ngay sau khi login
      const userData =
        loginResponse.user || (await getMe().then((r) => r.user || r));
      dispatch(checkLogin({ status: true, user: userData }));

      messageApi.success("Đăng nhập thành công!");
      setTimeout(() => {
        navigate(redirectPath || "/");
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
    <div className="auth-wrapper">
      {contextHolder}

      {/* Top bar with brand */}
      <header className="auth-topbar">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-logo">
            <span className="auth-brand-initial">T</span>
          </span>
          <span className="auth-brand-text">
            <span className="auth-brand-name">TASKMIND</span>
            <span className="auth-brand-sub">AI WORKSPACE</span>
          </span>
        </Link>
        <Link to="/register" className="auth-topbar-cta">
          Đăng Ký
        </Link>
      </header>

      <div className="auth-shell">
        <div className="auth-grid">
          {/* LEFT: informational panel */}
          <section className="auth-info soft-card">
            <span className="eyebrow">Đăng nhập</span>
            <h1 className="auth-info-title">
              CHÀO MỪNG
              <br />
              TRỞ LẠI TASKMIND.
            </h1>
            <p className="auth-info-desc">
              Đăng nhập an toàn để tiếp tục quản lý công việc bằng AI — lập kế
              hoạch, breakdown task, và đồng bộ lịch trình trong vài giây.
            </p>

            <div className="auth-steps-card">
              <div className="auth-steps-title">Quy trình</div>
              <ol className="auth-steps">
                <li>
                  <span className="step-num">1</span>
                  <span>Nhập email và mật khẩu của bạn.</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span>Hệ thống xác thực và mở workspace tương ứng.</span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span>Truy cập AI Breakdown, Calendar, và Teams.</span>
                </li>
                <li>
                  <span className="step-num">4</span>
                  <span>Phiên đăng nhập được lưu an toàn trên thiết bị.</span>
                </li>
              </ol>
            </div>

            <div className="auth-security-note">
              <div className="auth-security-label">Bảo mật</div>
              <p>
                Mật khẩu được mã hóa end-to-end. Bạn có thể đăng xuất tất cả
                thiết bị bất kỳ lúc nào trong Hồ sơ.
              </p>
            </div>
          </section>

          {/* RIGHT: form card */}
          <section className="auth-form-card soft-card">
            <span className="section-label">Bước 1</span>
            <h2 className="auth-form-title">Nhập thông tin đăng nhập</h2>
            <p className="auth-form-desc">
              Sử dụng email bạn đã đăng ký. Quên mật khẩu? Nhấn "Quên mật khẩu"
              bên dưới.
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              className="auth-form"
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
                  placeholder="you@example.com"
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

              <Form.Item className="auth-submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="auth-submit-btn"
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <Divider className="auth-divider">
              <span>hoặc</span>
            </Divider>

            <div className="auth-social">
              <Button
                block
                size="large"
                className="auth-social-btn"
                icon={<GoogleOutlined />}
                onClick={() => redirectToGoogleAuth(redirectPath || undefined)}
              >
                Đăng nhập bằng Google
              </Button>
              <Button
                block
                size="large"
                className="auth-social-btn"
                icon={<AppleOutlined />}
              >
                Đăng nhập bằng Apple
              </Button>
            </div>

            <p className="auth-bottom-link">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
