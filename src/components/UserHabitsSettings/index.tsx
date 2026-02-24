import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Select,
  Button,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Statistic,
  Tag,
  Space,
  Spin,
} from "antd";
import {
  ClockCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import type {
  UserHabits,
  ProductivityAnalysis,
} from "../../services/userHabitServices";
import { userHabitServices } from "../../services/userHabitServices";
import "./UserHabitsSettings.scss";

const { Title, Text } = Typography;
const { Option } = Select;

interface UserHabitsSettingsProps {
  userId?: string;
}

export const UserHabitsSettings: React.FC<UserHabitsSettingsProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setHabits] = useState<UserHabits | null>(null);
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const data = await userHabitServices.getHabits();
      setHabits(data.habits);
      setAnalysis(data.analysis);

      if (data.habits) {
        form.setFieldsValue({
          preferredWorkPattern: data.habits.preferredWorkPattern,
          preferredBreakDuration: data.habits.preferredBreakDuration,
          maxFocusDuration: data.habits.maxFocusDuration,
          autoBreakdown: data.habits.aiPreferences?.autoBreakdown ?? true,
          autoSchedule: data.habits.aiPreferences?.autoSchedule ?? true,
          prioritizeDeadline:
            data.habits.aiPreferences?.prioritizeDeadline ?? true,
          bufferBetweenTasks:
            data.habits.aiPreferences?.bufferBetweenTasks ?? 15,
        });
      }
    } catch (error) {
      message.error("Không thể tải thói quen");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (values: any) => {
    setSaving(true);
    try {
      await userHabitServices.updateHabits({
        preferredWorkPattern: values.preferredWorkPattern,
        preferredBreakDuration: values.preferredBreakDuration,
        maxFocusDuration: values.maxFocusDuration,
        aiPreferences: {
          autoBreakdown: values.autoBreakdown,
          autoSchedule: values.autoSchedule,
          prioritizeDeadline: values.prioritizeDeadline,
          bufferBetweenTasks: values.bufferBetweenTasks,
        },
      });
      message.success("Đã lưu thói quen");
      fetchHabits();
    } catch (error) {
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-habits-settings">
      <Title level={4}>
        <ClockCircleOutlined /> Thói quen làm việc
      </Title>
      <Text type="secondary">
        AI sẽ dùng thông tin này để tạo lịch phù hợp với bạn
      </Text>

      {/* Phân tích năng suất */}
      {analysis && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Tỷ lệ hoàn thành"
                  value={Math.round(analysis.completionRate * 100)}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{
                    color:
                      analysis.completionRate > 0.7 ? "#52c41a" : "#faad14",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <div className="stat-label">Giờ hiệu quả nhất</div>
                <Space wrap>
                  {analysis.mostProductiveHours.length > 0 ? (
                    analysis.mostProductiveHours.slice(0, 3).map((h) => (
                      <Tag key={h} color="blue">
                        {h}:00
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Chưa có dữ liệu</Text>
                  )}
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <div className="stat-label">Pattern làm việc</div>
                <Tag color="purple">
                  {analysis.pattern === "morning" && "🌅 Buổi sáng"}
                  {analysis.pattern === "afternoon" && "☀️ Buổi chiều"}
                  {analysis.pattern === "evening" && "🌙 Buổi tối"}
                  {analysis.pattern === "mixed" && "🔄 Linh hoạt"}
                </Tag>
              </Card>
            </Col>
          </Row>
          <Divider />
        </>
      )}

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSave}
          initialValues={{
            preferredWorkPattern: "mixed",
            preferredBreakDuration: 15,
            maxFocusDuration: 90,
            autoBreakdown: true,
            autoSchedule: true,
            prioritizeDeadline: true,
            bufferBetweenTasks: 15,
          }}
        >
          <Card
            title={
              <span>
                <BulbOutlined /> Tùy chọn AI
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="autoBreakdown"
                  valuePropName="checked"
                  label="Tự động chia nhỏ task"
                >
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  AI tự động breakdown task phức tạp khi tạo
                </Text>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="autoSchedule"
                  valuePropName="checked"
                  label="Tự động tạo lịch"
                >
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  AI sẽ đề xuất lịch làm việc tối ưu
                </Text>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="prioritizeDeadline"
                  valuePropName="checked"
                  label="Ưu tiên deadline"
                >
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="bufferBetweenTasks"
                  label="Thời gian nghỉ giữa task (phút)"
                >
                  <InputNumber min={0} max={60} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <span>
                <RiseOutlined /> Thói quen cá nhân
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="preferredWorkPattern"
                  label="Thời điểm làm việc hiệu quả nhất"
                >
                  <Select>
                    <Option value="morning">🌅 Buổi sáng (8h-12h)</Option>
                    <Option value="afternoon">☀️ Buổi chiều (13h-17h)</Option>
                    <Option value="evening">🌙 Buổi tối (18h-22h)</Option>
                    <Option value="mixed">🔄 Linh hoạt cả ngày</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="maxFocusDuration"
                  label="Thời gian tập trung tối đa (phút)"
                >
                  <InputNumber min={15} max={240} style={{ width: "100%" }} />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  AI sẽ không xếp task liên tục quá thời gian này
                </Text>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="preferredBreakDuration"
                  label="Thời gian nghỉ giữa các session (phút)"
                >
                  <InputNumber min={5} max={120} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              size="large"
            >
              Lưu thói quen
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default UserHabitsSettings;
