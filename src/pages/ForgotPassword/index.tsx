import { useState } from "react";
import { Form, Input, Button, message, Typography, Steps } from "antd";
import { useNavigate, Link } from "react-router-dom";
import {
  MailOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import {
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../../services/authServices";
import "./ForgotPassword.scss";

const { Title, Text } = Typography;

interface EmailFormData {
  email: string;
}

interface OtpFormData {
  otp: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const [emailForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Step 0: Send OTP to email
  const onEmailSubmit = async (values: EmailFormData) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      setCurrentStep(1);
      messageApi.success("Mã OTP đã được gửi đến email của bạn!");
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message ||
          "Không thể gửi yêu cầu. Vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP
  const onOtpSubmit = async (values: OtpFormData) => {
    setLoading(true);
    try {
      await verifyForgotPasswordOtp(email, values.otp);
      setOtp(values.otp);
      setCurrentStep(2);
      messageApi.success("Xác thực OTP thành công!");
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn!",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const onPasswordSubmit = async (values: PasswordFormData) => {
    if (values.newPassword !== values.confirmPassword) {
      messageApi.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, values.newPassword);
      messageApi.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message ||
          "Không thể đặt lại mật khẩu. Vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await forgotPassword(email);
      messageApi.success("Mã OTP mới đã được gửi!");
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Không thể gửi lại OTP!",
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Email", icon: <MailOutlined /> },
    { title: "Xác thực", icon: <SafetyOutlined /> },
    { title: "Mật khẩu", icon: <LockOutlined /> },
  ];

  // Step 0: Email Input Form
  const renderEmailStep = () => (
    <div className="step-content">
      <Title level={4}>Quên mật khẩu?</Title>
      <Text type="secondary" className="step-description">
        Nhập email của bạn để nhận mã OTP xác thực.
      </Text>

      <Form
        form={emailForm}
        layout="vertical"
        onFinish={onEmailSubmit}
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="submit-button"
          >
            Gửi mã OTP
          </Button>
        </Form.Item>
      </Form>

      <Link to="/login" className="back-to-login">
        <ArrowLeftOutlined /> Quay lại đăng nhập
      </Link>
    </div>
  );

  // Step 1: OTP Verification Form
  const renderOtpStep = () => (
    <div className="step-content">
      <Title level={4}>Nhập mã OTP</Title>
      <Text type="secondary" className="step-description">
        Mã OTP đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp
        thư.
      </Text>

      <Form
        form={otpForm}
        layout="vertical"
        onFinish={onOtpSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="Mã OTP"
          name="otp"
          rules={[
            { required: true, message: "Vui lòng nhập mã OTP!" },
            { len: 6, message: "Mã OTP phải có 6 số!" },
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
            className="submit-button"
          >
            Xác thực
          </Button>
        </Form.Item>
      </Form>

      <div className="resend-section">
        <Text type="secondary">Không nhận được mã? </Text>
        <Button type="link" onClick={resendOtp} loading={loading} size="small">
          Gửi lại OTP
        </Button>
      </div>

      <Button
        type="link"
        onClick={() => setCurrentStep(0)}
        className="change-email"
      >
        <ArrowLeftOutlined /> Đổi email khác
      </Button>
    </div>
  );

  // Step 2: New Password Form
  const renderPasswordStep = () => (
    <div className="step-content">
      <Title level={4}>Đặt mật khẩu mới</Title>
      <Text type="secondary" className="step-description">
        Tạo mật khẩu mới cho tài khoản của bạn.
      </Text>

      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={onPasswordSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="input-icon" />}
            placeholder="Nhập mật khẩu mới"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu!" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="input-icon" />}
            placeholder="Nhập lại mật khẩu mới"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="submit-button"
          >
            Đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderEmailStep();
      case 1:
        return renderOtpStep();
      case 2:
        return renderPasswordStep();
      default:
        return renderEmailStep();
    }
  };

  return (
    <div className="forgot-password-page">
      {contextHolder}
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Logo */}
          <div className="card-header">
            <div className="logo-section">
              <div className="logo-icon">▲</div>
              <span className="logo-text">TaskMind AI</span>
            </div>
          </div>

          {/* Steps */}
          <Steps
            current={currentStep}
            items={steps}
            className="forgot-steps"
            size="small"
          />

          {/* Step Content */}
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
