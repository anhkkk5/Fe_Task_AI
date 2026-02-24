import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  List,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Space,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  ArrowRightOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTasks } from "../../hooks/useTasks";
import { getMe } from "../../services/authServices";
import { useDispatch, useSelector } from "react-redux";
import "./Home.scss";

const { Title, Text } = Typography;

const aiSuggestions: any[] = [];
const upcomingDeadlines: any[] = [];

function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.loginReducer);
  const { tasks, loading, handleCreate, handleUpdate, handleDelete } =
    useTasks();

  console.log("Home: tasks count:", tasks.length, "loading:", loading);

  const [stats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.name) {
        try {
          const response = await getMe();
          const userData = response.user || response;
          dispatch({ type: "UPDATE_USER", payload: userData });
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      }
    };
    fetchUser();
  }, [dispatch, user]);

  // Handle create
  const onCreateSubmit = async (values: any) => {
    setCreateLoading(true);
    const success = await handleCreate(values);
    setCreateLoading(false);
    if (success) {
      setIsCreateModalOpen(false);
      createForm.resetFields();
    }
  };

  // Handle edit click
  const onEditClick = (task: any) => {
    setEditingTask(task);
    editForm.setFieldsValue({
      title: task.title,
      status: task.status,
      priority: task.priority,
    });
    setIsEditModalOpen(true);
  };

  // Handle update
  const onUpdateSubmit = async (values: any) => {
    if (!editingTask) return;
    setEditLoading(true);
    const success = await handleUpdate(editingTask._id, values);
    setEditLoading(false);
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <div className="task-title-cell">
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="task-id">
            #{record._id?.slice(-6)}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: "default", text: "Chờ xử lý" },
          in_progress: { color: "processing", text: "Đang thực hiện" },
          completed: { color: "success", text: "Hoàn thành" },
          cancelled: { color: "error", text: "Đã hủy" },
        };
        const { color, text } = map[status] || map.pending;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => {
        const map: Record<string, { color: string; text: string }> = {
          low: { color: "default", text: "Thấp" },
          medium: { color: "warning", text: "Trung bình" },
          high: { color: "error", text: "Cao" },
        };
        const { color, text } = map[priority] || map.low;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (date: string) =>
        date ? (
          <Text>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {new Date(date).toLocaleDateString("vi-VN")}
          </Text>
        ) : (
          "—"
        ),
    },
    {
      title: "",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditClick(record)}
          />
          <Popconfirm
            title="Xóa công việc"
            description="Bạn có chắc muốn xóa công việc này?"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="welcome-section">
          <Title level={3} className="welcome-title">
            Chào mừng {user?.name || "bạn"}, quản lý công việc của bạn hôm nay
            thế nào?
          </Title>
        </section>

        <Row gutter={[24, 24]} className="stats-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card total">
              <div className="stat-icon">
                <FolderOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.total}</Text>
                <Text className="stat-label">Tổng công việc</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card in-progress">
              <div className="stat-icon">
                <ClockCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.inProgress}</Text>
                <Text className="stat-label">Đang thực hiện</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card completed">
              <div className="stat-icon">
                <CheckCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.completed}</Text>
                <Text className="stat-label">Hoàn thành</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card overdue">
              <div className="stat-icon">
                <ExclamationCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-value">{stats.overdue}</Text>
                <Text className="stat-label">Quá hạn</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} className="main-grid">
          <Col xs={24} lg={16}>
            <Card
              className="tasks-card"
              title={<Title level={4}>Công việc của tôi</Title>}
              extra={
                <div className="card-actions">
                  <Button
                    type="link"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusOutlined /> Thêm nhanh
                  </Button>
                  <Button type="link">
                    Xem tất cả <ArrowRightOutlined />
                  </Button>
                </div>
              }
            >
              <Table
                columns={columns}
                dataSource={tasks}
                loading={loading}
                pagination={false}
                rowKey="_id"
                size="small"
              />
            </Card>

            <Card className="ai-suggestions-card" style={{ marginTop: 24 }}>
              <div className="ai-header">
                <RobotOutlined className="ai-icon" />
                <Title level={5} style={{ margin: 0 }}>
                  Gợi ý từ AI
                </Title>
              </div>
              <List
                dataSource={aiSuggestions}
                renderItem={(item) => (
                  <List.Item className="ai-suggestion-item">
                    <div className="suggestion-content">
                      <Text strong>{item.title}</Text>
                      <br />
                      <Text type="secondary" className="suggestion-desc">
                        {item.description}
                      </Text>
                    </div>
                    {item.type === "action" && (
                      <Button type="primary" size="small">
                        Áp dụng
                      </Button>
                    )}
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card className="quick-actions-card">
              <Title level={5}>Thao tác nhanh</Title>
              <div className="quick-actions">
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Thêm công việc
                </Button>
                <Button block size="large" icon={<RobotOutlined />}>
                  Yêu cầu AI
                </Button>
                <Button block size="large" icon={<TeamOutlined />}>
                  Mời thành viên
                </Button>
                <Button block size="large" icon={<CalendarOutlined />}>
                  Xem lịch
                </Button>
              </div>
            </Card>

            <Card className="deadlines-card" style={{ marginTop: 24 }}>
              <Title level={5}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Sắp đến hạn
              </Title>
              <List
                dataSource={upcomingDeadlines}
                renderItem={(item) => (
                  <List.Item className="deadline-item">
                    <div className="deadline-info">
                      <Text strong className="deadline-title">
                        {item.title}
                      </Text>
                      <br />
                      <Text type="secondary" className="deadline-date">
                        {item.dueDate}
                      </Text>
                    </div>
                    <Tag color={item.daysLeft <= 1 ? "error" : "warning"}>
                      {item.daysLeft} ngày
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </main>

      {/* Create Task Modal */}
      <Modal
        title="Thêm công việc mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createLoading}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form form={createForm} layout="vertical" onFinish={onCreateSubmit}>
          <Form.Item
            name="title"
            label="Tên công việc"
            rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
          >
            <Input placeholder="Nhập tên công việc" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả công việc" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" initialValue="pending">
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="in_progress">Đang thực hiện</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Ưu tiên" initialValue="medium">
            <Select placeholder="Chọn mức độ ưu tiên">
              <Select.Option value="low">Thấp</Select.Option>
              <Select.Option value="medium">Trung bình</Select.Option>
              <Select.Option value="high">Cao</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="deadline" label="Hạn chót">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hạn chót"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        title="Chỉnh sửa công việc"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={onUpdateSubmit}>
          <Form.Item
            name="title"
            label="Tên công việc"
            rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
          >
            <Input placeholder="Nhập tên công việc" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="in_progress">Đang thực hiện</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="Ưu tiên"
            rules={[
              { required: true, message: "Vui lòng chọn mức độ ưu tiên" },
            ]}
          >
            <Select placeholder="Chọn mức độ ưu tiên">
              <Select.Option value="low">Thấp</Select.Option>
              <Select.Option value="medium">Trung bình</Select.Option>
              <Select.Option value="high">Cao</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Home;
