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
    <div className="register-wrapper">
      <div className="register-page">
        {contextHolder}
        {/* Left side - Register Form */}
        <div className="register-left">
          <div className="register-form-container">
            <div className="register-header">
              <h1 className="register-title">Tạo tài khoản mới</h1>
              <p className="register-subtitle">
                Bắt đầu hành trình nâng suất của bạn miễn phí.
              </p>
            </div>

            <Form
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

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="register-button"
                >
                  Đăng ký miễn phí
                </Button>
              </Form.Item>
            </Form>

            <div className="divider">
              <span className="divider-text">Hoặc đăng ký với</span>
            </div>

            <Button
              block
              size="large"
              className="social-button"
              icon={<GoogleOutlined />}
            >
              Đăng ký bằng Google
            </Button>

            <p className="login-link">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>

        {/* Right side - Background Image */}
        <div className="register-right">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">
              "TaskMind AI đã thay đổi hoàn toàn cách tôi làm việc. Nó như một
              người trợ lý thực thụ, giúp tôi tập trung hơn bao giờ hết."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">N</div>
              <div className="author-info">
                <p className="author-name">Nguyễn Văn A</p>
                <p className="author-title">UX Designer tại TechFlow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
