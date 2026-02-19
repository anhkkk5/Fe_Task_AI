import { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { useNavigate, Link } from "react-router-dom";
import {
  MailOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "./ForgotPassword.scss";

const { Title, Text } = Typography;

interface ForgotPasswordFormData {
  email: string;
}

function ForgotPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const onFinish = async (_values: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      // Call API to send reset password email
      // await post("/auth/forgot-password", { email: values.email });

      setSubmitted(true);
      messageApi.success("Đã gửi email khôi phục mật khẩu!");
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Không thể gửi yêu cầu",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-page">
        {contextHolder}
        <div className="forgot-password-container">
          <div className="forgot-password-card success-card">
            <CheckCircleOutlined className="success-icon" />
            <Title level={3}>Đã gửi email!</Title>
            <Text type="secondary">
              Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu.
            </Text>
            <Button
              type="primary"
              onClick={() => navigate("/login")}
              className="back-to-login"
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      {contextHolder}
      <div className="forgot-password-container">
        <Link to="/login" className="back-link">
          <ArrowLeftOutlined /> Quay lại đăng nhập
        </Link>

        <div className="forgot-password-card">
          <Title level={3} className="forgot-title">
            Quên mật khẩu?
          </Title>
          <Text type="secondary" className="forgot-subtitle">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </Text>

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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="submit-button"
              >
                Gửi yêu cầu
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
