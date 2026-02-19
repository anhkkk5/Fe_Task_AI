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
      messageApi.error(error.response?.data?.message || "Không thể gửi lại OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-otp-page">
      {contextHolder}
      <div className="verify-otp-container">
        <Link to="/register" className="back-link">
          <ArrowLeftOutlined /> Quay lại đăng ký
        </Link>

        <div className="verify-otp-card">
          <div className="otp-icon">
            <MailOutlined />
          </div>

          <Title level={3} className="otp-title">Xác thực email</Title>
          <Text type="secondary" className="otp-subtitle">
            Chúng tôi đã gửi mã OTP đến {email || "email của bạn"}.
            <br />
            Vui lòng nhập mã để hoàn tất đăng ký.
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="otp"
              rules={[
                { required: true, message: "Vui lòng nhập mã OTP!" },
                { len: 6, message: "Mã OTP phải có 6 chữ số!" },
              ]}
            >
              <Input.OTP length={6} size="large" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="verify-button"
              >
                Xác thực
              </Button>
            </Form.Item>
          </Form>

          <div className="resend-section">
            <Text type="secondary">Không nhận được mã?</Text>
            <Button
              type="link"
              onClick={handleResendOtp}
              loading={resendLoading}
            >
              Gửi lại OTP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
