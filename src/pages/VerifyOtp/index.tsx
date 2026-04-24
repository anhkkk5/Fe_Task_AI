import { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { verifyOtp, resendOtp } from "../../services/authServices";
import "./VerifyOtp.scss";

const { Title, Text } = Typography;

interface OtpFormData {
  otp: string;
}

function VerifyOtp() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const onFinish = async (values: OtpFormData) => {
    if (!email) {
      messageApi.error("Không tìm thấy email. Vui lòng đăng ký lại.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, values.otp);
      messageApi.success("Xác thực thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "OTP không hợp lệ!";
      messageApi.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await resendOtp(email);
      messageApi.success("Đã gửi lại OTP!");
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Không thể gửi lại OTP",
      );
    } finally {
      setResendLoading(false);
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
        <div className="auth-grid auth-grid-single">
          <section className="auth-form-card soft-card">
            <Link to="/register" className="auth-back-link">
              <ArrowLeftOutlined /> Quay lại đăng ký
            </Link>

            <div className="auth-icon-badge">
              <MailOutlined />
            </div>

            <span className="section-label">Bước 2</span>
            <Title level={3} className="auth-form-title">
              Xác thực email của bạn
            </Title>
            <Text className="auth-form-desc">
              Chúng tôi đã gửi mã OTP 6 số đến{" "}
              <strong>{email || "email của bạn"}</strong>. Vui lòng nhập mã để
              hoàn tất đăng ký.
            </Text>

            <Form
              className="auth-form auth-form-otp"
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                name="otp"
                label="Mã OTP"
                rules={[
                  { required: true, message: "Vui lòng nhập mã OTP!" },
                  { len: 6, message: "Mã OTP phải có 6 chữ số!" },
                ]}
              >
                <Input.OTP length={6} size="large" />
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
                  Xác thực mã OTP
                </Button>
              </Form.Item>
            </Form>

            <div className="auth-resend">
              <Text type="secondary">Không nhận được mã?</Text>
              <Button
                type="link"
                onClick={handleResendOtp}
                loading={resendLoading}
                className="auth-resend-btn"
              >
                Gửi lại OTP
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
