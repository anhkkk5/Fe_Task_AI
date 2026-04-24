import { useState } from "react";
import { Form, Input, Button, message, Checkbox, Progress } from "antd";
import { useNavigate, Link } from "react-router-dom";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined,
} from "@ant-design/icons";
import { registerUser } from "../../services/authServices";
import "./Register.scss";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

function Register() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength === 0) return "";
    if (strength <= 25) return "Mật khẩu yếu";
    if (strength <= 50) return "Mật khẩu trung bình";
    if (strength <= 75) return "Mật khẩu khá mạnh";
    return "Mật khẩu mạnh";
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 25) return "#ff4d4f";
    if (strength <= 50) return "#faad14";
    if (strength <= 75) return "#52c41a";
    return "#389e0d";
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      messageApi.success("Đăng ký thành công! Vui lòng xác thực email.");

      setTimeout(() => {
        navigate("/verify-otp", { state: { email: values.email } });
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
      messageApi.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {contextHolder}

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
        <Link to="/login" className="auth-topbar-cta">
          Đăng Nhập
        </Link>
      </header>

      <div className="auth-shell">
        <div className="auth-grid">
          {/* LEFT: informational panel */}
          <section className="auth-info soft-card">
            <span className="eyebrow">Đăng ký</span>
            <h1 className="auth-info-title">
              BẮT ĐẦU VỚI
              <br />
              TASKMIND AI.
            </h1>
            <p className="auth-info-desc">
              Tạo tài khoản miễn phí để truy cập AI Breakdown, Calendar thông
              minh và hệ thống gợi ý lịch trình tối ưu cho công việc cá nhân.
            </p>

            <div className="auth-steps-card">
              <div className="auth-steps-title">Những gì bạn nhận được</div>
              <ol className="auth-steps">
                <li>
                  <span className="step-num">1</span>
                  <span>AI breakdown công việc thành subtasks có thứ tự.</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span>
                    Gợi ý lịch tự động dựa trên deadline và mức ưu tiên.
                  </span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span>Chat AI hỗ trợ thực thi từng subtask.</span>
                </li>
                <li>
                  <span className="step-num">4</span>
                  <span>Đồng bộ đa thiết bị, bảo mật token an toàn.</span>
                </li>
              </ol>
            </div>

            <div className="auth-security-note">
              <div className="auth-security-label">Miễn phí</div>
              <p>
                Không cần thẻ tín dụng. Nâng cấp bất kỳ lúc nào để mở khóa thêm
                dung lượng AI.
              </p>
            </div>
          </section>

          {/* RIGHT: form card */}
          <section className="auth-form-card soft-card">
            <span className="section-label">Bước 1</span>
            <h2 className="auth-form-title">Tạo tài khoản mới</h2>
            <p className="auth-form-desc">
              Chỉ mất 30 giây. Sau khi đăng ký, bạn sẽ xác thực email bằng mã
              OTP 6 số.
            </p>

            <Form
              className="auth-form"
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập họ và tên!" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="Nhập họ và tên của bạn"
                  size="large"
                />
              </Form.Item>

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
                  placeholder="name@gmail.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu!" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Tạo một mật khẩu mạnh"
                  size="large"
                  onChange={onPasswordChange}
                  iconRender={(visible: boolean) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              {passwordStrength > 0 && (
                <div className="password-strength">
                  <Progress
                    percent={passwordStrength}
                    showInfo={false}
                    strokeColor={getPasswordStrengthColor(passwordStrength)}
                    size="small"
                  />
                  <span
                    className="strength-text"
                    style={{
                      color: getPasswordStrengthColor(passwordStrength),
                    }}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
              )}

              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Mật khẩu không khớp!"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Nhập lại mật khẩu"
                  size="large"
                  iconRender={(visible: boolean) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="agree"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("Vui lòng đồng ý với điều khoản"),
                          ),
                  },
                ]}
              >
                <Checkbox>
                  Tôi đồng ý với{" "}
                  <a href="#" className="terms-link">
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a href="#" className="terms-link">
                    Chính sách bảo mật
                  </a>
                </Checkbox>
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
                  Đăng ký miễn phí
                </Button>
              </Form.Item>
            </Form>

            <div className="auth-divider-plain">
              <span>hoặc đăng ký với</span>
            </div>

            <div className="auth-social">
              <Button
                block
                size="large"
                className="auth-social-btn"
                icon={<GoogleOutlined />}
              >
                Đăng ký bằng Google
              </Button>
            </div>

            <p className="auth-bottom-link">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Register;
