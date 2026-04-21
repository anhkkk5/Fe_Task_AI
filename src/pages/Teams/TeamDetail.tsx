import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  Button,
  Spin,
  message,
  Tag,
  Avatar,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Empty,
  Badge,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  getTeam,
  type Team,
  type TeamMember,
  type TeamRole,
  inviteMember,
  listPendingInvites,
  revokeInvite,
  removeMember,
  getTeamBoard,
  createTeamTask,
  lookupUserByEmail,
} from "../../services/teamServices";
import "./TeamDetail.scss";
import dayjs from "dayjs";

const roleColors: Record<TeamRole, string> = {
  owner: "gold",
  admin: "blue",
  member: "default",
  viewer: "default",
};

const roleLabels: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Thành viên",
  viewer: "Xem",
};

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((s: any) => s.auth.user);
  const currentUserId =
    currentUser?._id || currentUser?.id || currentUser?.userId;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm] = Form.useForm();
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskKeyword, setTaskKeyword] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>("all");
  const [taskReporterFilter, setTaskReporterFilter] = useState<string>("all");
  const [taskStartRange, setTaskStartRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [taskDeadlineRange, setTaskDeadlineRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  // User lookup state
  const [lookupResult, setLookupResult] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const myRole = team?.members.find((m) => m.userId === currentUserId)?.role;
  const isAdmin = myRole === "owner" || myRole === "admin";

  // Debounced email lookup
  const handleEmailChange = useCallback((email: string) => {
    setLookupResult(null);
    setLookupError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLookupLoading(true);
    const timer = setTimeout(async () => {
      try {
        const user = await lookupUserByEmail(email);
        setLookupResult(user);
        setLookupError(null);
      } catch {
        setLookupResult(null);
        setLookupError(
          "Email này chưa có tài khoản trong hệ thống. Lời mời vẫn sẽ được gửi.",
        );
      } finally {
        setLookupLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id) loadTeam();
  }, [id]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const [teamData, boardData] = await Promise.all([
        getTeam(id!),
        getTeamBoard(id!),
      ]);
      setTeam(teamData);
      setBoard(boardData);
      const myRoleInTeam = teamData.members.find(
        (m) => m.userId === currentUserId,
      )?.role;
      const canManageInvites =
        myRoleInTeam === "owner" || myRoleInTeam === "admin";

      if (canManageInvites) {
        const invites = await listPendingInvites(id!);
        setPendingInvites(invites);
      }
    } catch {
      message.error("Không thể tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamTask = async (values: {
    title: string;
    status: "todo" | "in_progress" | "completed" | "cancelled";
    assigneeId: string;
    startAt?: dayjs.Dayjs;
    deadline?: dayjs.Dayjs;
  }) => {
    try {
      setCreatingTask(true);
      await createTeamTask(id!, {
        title: values.title,
        status: values.status,
        assigneeId: values.assigneeId,
        startAt: values.startAt?.toISOString(),
        deadline: values.deadline?.toISOString(),
      });
      message.success("Tạo công việc nhóm thành công");
      setTaskModalOpen(false);
      taskForm.resetFields();
      await loadTeam();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể tạo công việc");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleInvite = async (values: { email: string; role: TeamRole }) => {
    try {
      setInviting(true);
      await inviteMember(id!, values.email, values.role);
      message.success(`Đã gửi lời mời đến ${values.email}`);
      setInviteModal(false);
      inviteForm.resetFields();
      const invites = await listPendingInvites(id!);
      setPendingInvites(invites);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể gửi lời mời");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const updated = await removeMember(id!, memberId);
      setTeam(updated);
      message.success("Đã xóa thành viên");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể xóa thành viên");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvite(id!, inviteId);
      setPendingInvites((prev) => prev.filter((i) => i._id !== inviteId));
      message.success("Đã thu hồi lời mời");
    } catch {
      message.error("Không thể thu hồi lời mời");
    }
  };

  if (loading)
    return (
      <div className="team-detail-loading">
        <Spin size="large" />
      </div>
    );
  if (!team) return <div>Team không tồn tại</div>;

  const memberColumns = [
    {
      title: "Thành viên",
      key: "member",
      render: (m: TeamMember) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            src={m.avatar}
            style={{ backgroundColor: "var(--color-primary-blue)" }}
          >
            {!m.avatar && m.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{m.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {m.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (m: TeamMember) => (
        <Tag color={roleColors[m.role]}>{roleLabels[m.role]}</Tag>
      ),
    },
    {
      title: "Tham gia",
      key: "joinedAt",
      render: (m: TeamMember) =>
        new Date(m.joinedAt).toLocaleDateString("vi-VN"),
    },
    ...(isAdmin
      ? [
          {
            title: "",
            key: "actions",
            render: (m: TeamMember) =>
              m.role !== "owner" ? (
                <Popconfirm
                  title="Xóa thành viên này?"
                  onConfirm={() => handleRemoveMember(m.userId)}
                  okText="Xóa"
                  cancelText="Huỷ"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>
              ) : null,
          },
        ]
      : []),
  ];

  const allTasks = board
    ? [
        ...(board.todo || []),
        ...(board.in_progress || []),
        ...(board.completed || []),
      ]
    : [];

  const membersById = new Map(team.members.map((m) => [m.userId, m]));

  const filteredTasks = allTasks.filter((task: any) => {
    const matchesKeyword =
      !taskKeyword.trim() ||
      String(task.title || "")
        .toLowerCase()
        .includes(taskKeyword.trim().toLowerCase());

    const matchesStatus =
      taskStatusFilter === "all" || task.status === taskStatusFilter;

    const assigneeId = String(task.teamAssignment?.assigneeId || "");
    const matchesAssignee =
      taskAssigneeFilter === "all" || assigneeId === taskAssigneeFilter;

    const reporterId = String(task.teamAssignment?.assignedBy || "");
    const matchesReporter =
      taskReporterFilter === "all" || reporterId === taskReporterFilter;

    const taskStartRaw =
      task?.teamAssignment?.startAt || task?.scheduledTime?.start;
    const taskStart = taskStartRaw ? dayjs(taskStartRaw) : null;
    const matchesStartRange =
      !taskStartRange ||
      (!taskStartRange[0] && !taskStartRange[1]) ||
      (!!taskStart &&
        (!taskStartRange[0] || taskStart.isAfter(taskStartRange[0])) &&
        (!taskStartRange[1] || taskStart.isBefore(taskStartRange[1])));

    const taskDeadline = task?.deadline ? dayjs(task.deadline) : null;
    const matchesDeadlineRange =
      !taskDeadlineRange ||
      (!taskDeadlineRange[0] && !taskDeadlineRange[1]) ||
      (!!taskDeadline &&
        (!taskDeadlineRange[0] || taskDeadline.isAfter(taskDeadlineRange[0])) &&
        (!taskDeadlineRange[1] || taskDeadline.isBefore(taskDeadlineRange[1])));

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesAssignee &&
      matchesReporter &&
      matchesStartRange &&
      matchesDeadlineRange
    );
  });

  const taskColumns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (title: string, task: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          {task.description && (
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {task.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      key: "assignee",
      render: (task: any) =>
        task.teamAssignment ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar
              size="small"
              style={{ backgroundColor: "var(--color-primary-blue)" }}
            >
              {task.teamAssignment.assigneeName?.charAt(0)}
            </Avatar>
            <span style={{ fontSize: 13 }}>
              {task.teamAssignment.assigneeName}
            </span>
          </div>
        ) : (
          <span style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>
            Chưa phân công
          </span>
        ),
    },
    {
      title: "Người giao",
      key: "reporter",
      render: (task: any) => {
        const reporterId = String(task.teamAssignment?.assignedBy || "");
        const reporter = membersById.get(reporterId);
        return reporter ? reporter.name : "-";
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const map: Record<string, string> = {
          todo: "default",
          in_progress: "processing",
          completed: "success",
          cancelled: "error",
        };
        const labels: Record<string, string> = {
          todo: "Chờ",
          in_progress: "Đang làm",
          completed: "Hoàn thành",
          cancelled: "Huỷ",
        };
        return <Badge status={map[s] as any} text={labels[s] || s} />;
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (p: string) => {
        const colors: Record<string, string> = {
          low: "default",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };
        return <Tag color={colors[p]}>{p}</Tag>;
      },
    },
    {
      title: "Bắt đầu",
      key: "startAt",
      render: (task: any) =>
        task?.teamAssignment?.startAt || task?.scheduledTime?.start
          ? dayjs(
              task?.teamAssignment?.startAt || task?.scheduledTime?.start,
            ).format("DD/MM/YYYY HH:mm")
          : "-",
    },
    {
      title: "Deadline",
      key: "deadline",
      render: (task: any) =>
        task?.deadline ? dayjs(task.deadline).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <div className="team-detail-page">
      <div className="team-detail-main">
        <div className="team-detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/teams")}
          >
            Quay lại
          </Button>
          <div className="team-title-section">
            <h2>{team.name}</h2>
            {team.description && <p>{team.description}</p>}
          </div>
          <div className="team-meta">
            <Tag color="blue">{team.members.length} thành viên</Tag>
            {myRole && (
              <Tag color={roleColors[myRole]}>{roleLabels[myRole]}</Tag>
            )}
          </div>
        </div>

        <Tabs
          defaultActiveKey="members"
          items={[
            {
              key: "members",
              label: `Thành viên (${team.members.length})`,
              children: (
                <div>
                  {isAdmin && (
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => setInviteModal(true)}
                      >
                        Mời thành viên
                      </Button>
                    </div>
                  )}
                  <Table
                    dataSource={team.members}
                    columns={memberColumns}
                    rowKey="userId"
                    pagination={false}
                    size="middle"
                  />
                  {pendingInvites.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4
                        style={{
                          marginBottom: 12,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Lời mời đang chờ ({pendingInvites.length})
                      </h4>
                      <Table
                        dataSource={pendingInvites}
                        rowKey="_id"
                        size="small"
                        pagination={false}
                        columns={[
                          { title: "Email", dataIndex: "email" },
                          {
                            title: "Role",
                            dataIndex: "role",
                            render: (r: TeamRole) => (
                              <Tag color={roleColors[r]}>{roleLabels[r]}</Tag>
                            ),
                          },
                          {
                            title: "Hết hạn",
                            dataIndex: "expiresAt",
                            render: (d: string) =>
                              new Date(d).toLocaleDateString("vi-VN"),
                          },
                          {
                            title: "",
                            render: (inv: any) => (
                              <Popconfirm
                                title="Thu hồi lời mời?"
                                onConfirm={() => handleRevokeInvite(inv._id)}
                                okText="Thu hồi"
                                cancelText="Huỷ"
                              >
                                <Button type="text" danger size="small">
                                  Thu hồi
                                </Button>
                              </Popconfirm>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "tasks",
              label: `Công việc (${allTasks.length})`,
              children: (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <Space wrap>
                      <Input
                        placeholder="Tìm theo tên công việc"
                        value={taskKeyword}
                        onChange={(e) => setTaskKeyword(e.target.value)}
                        style={{ width: 220 }}
                      />
                      <Select
                        value={taskStatusFilter}
                        onChange={setTaskStatusFilter}
                        style={{ width: 150 }}
                      >
                        <Select.Option value="all">
                          Tất cả trạng thái
                        </Select.Option>
                        <Select.Option value="todo">Chờ</Select.Option>
                        <Select.Option value="in_progress">
                          Đang làm
                        </Select.Option>
                        <Select.Option value="completed">
                          Hoàn thành
                        </Select.Option>
                        <Select.Option value="cancelled">Huỷ</Select.Option>
                      </Select>
                      <Select
                        value={taskAssigneeFilter}
                        onChange={setTaskAssigneeFilter}
                        style={{ width: 170 }}
                      >
                        <Select.Option value="all">
                          Tất cả người làm
                        </Select.Option>
                        {team.members.map((m) => (
                          <Select.Option key={m.userId} value={m.userId}>
                            {m.name}
                          </Select.Option>
                        ))}
                      </Select>
                      <Select
                        value={taskReporterFilter}
                        onChange={setTaskReporterFilter}
                        style={{ width: 170 }}
                      >
                        <Select.Option value="all">
                          Tất cả người giao
                        </Select.Option>
                        {team.members.map((m) => (
                          <Select.Option key={m.userId} value={m.userId}>
                            {m.name}
                          </Select.Option>
                        ))}
                      </Select>
                      <DatePicker.RangePicker
                        showTime
                        value={taskStartRange as any}
                        onChange={(value) => setTaskStartRange(value as any)}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={["Bắt đầu từ", "Bắt đầu đến"]}
                      />
                      <DatePicker.RangePicker
                        showTime
                        value={taskDeadlineRange as any}
                        onChange={(value) => setTaskDeadlineRange(value as any)}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={["Deadline từ", "Deadline đến"]}
                      />
                    </Space>

                    <Button
                      type="primary"
                      onClick={() => setTaskModalOpen(true)}
                    >
                      Thêm công việc nhóm
                    </Button>
                  </div>

                  <Table
                    dataSource={filteredTasks}
                    columns={taskColumns}
                    rowKey="_id"
                    size="middle"
                    pagination={{ pageSize: 10 }}
                    locale={{
                      emptyText: (
                        <Empty description="Chưa có công việc nào được phân công" />
                      ),
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="Tạo công việc nhóm"
        open={taskModalOpen}
        onCancel={() => {
          setTaskModalOpen(false);
          taskForm.resetFields();
        }}
        onOk={() => taskForm.submit()}
        confirmLoading={creatingTask}
        okText="Tạo"
        cancelText="Huỷ"
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleCreateTeamTask}
          initialValues={{
            status: "todo",
            assigneeId: currentUserId,
          }}
        >
          <Form.Item
            name="title"
            label="Tên công việc"
            rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
          >
            <Input placeholder="Ví dụ: Chuẩn bị báo cáo sprint" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select>
              <Select.Option value="todo">Chờ</Select.Option>
              <Select.Option value="in_progress">Đang làm</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Huỷ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="assigneeId"
            label="Người thực hiện"
            rules={[
              { required: true, message: "Vui lòng chọn người thực hiện" },
            ]}
          >
            <Select>
              {team.members.map((m) => (
                <Select.Option key={m.userId} value={m.userId}>
                  {m.name} ({m.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Người giao việc">
            <Input
              value={currentUser?.name || currentUser?.email || "Bạn"}
              disabled
            />
          </Form.Item>

          <Form.Item name="startAt" label="Thời gian bắt đầu">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item name="deadline" label="Deadline">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Mời thành viên"
        open={inviteModal}
        onCancel={() => {
          setInviteModal(false);
          inviteForm.resetFields();
          setLookupResult(null);
          setLookupError(null);
        }}
        footer={null}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInvite}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            name="email"
            label="Email người được mời"
            rules={[
              {
                required: true,
                type: "email",
                message: "Vui lòng nhập email hợp lệ",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: baoawm1@gmail.com (không cần có tài khoản sẵn)"
              onChange={(e) => handleEmailChange(e.target.value)}
              suffix={
                lookupLoading ? (
                  <LoadingOutlined
                    style={{ color: "var(--color-primary-blue)" }}
                  />
                ) : null
              }
            />
          </Form.Item>

          {/* User preview - like Jira */}
          {lookupResult && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: "var(--color-very-light-blue)",
                borderRadius: 8,
                marginBottom: 16,
                border: "1px solid var(--color-lighter-blue)",
              }}
            >
              <Avatar
                src={lookupResult.avatar}
                size={40}
                style={{
                  backgroundColor: "var(--color-primary-blue)",
                  flexShrink: 0,
                }}
              >
                {!lookupResult.avatar &&
                  lookupResult.name.slice(0, 2).toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {lookupResult.name}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
                >
                  {lookupResult.email}
                </div>
              </div>
              <CheckCircleFilled
                style={{ color: "var(--color-success)", fontSize: 18 }}
              />
            </div>
          )}

          {lookupError && (
            <div
              style={{
                padding: "8px 12px",
                background: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 6,
                fontSize: 13,
                color: "#ad6800",
                marginBottom: 16,
              }}
            >
              {lookupError}
            </div>
          )}

          <Form.Item name="role" label="Vai trò" initialValue="member">
            <Select>
              <Select.Option value="admin">
                Admin — Có thể quản lý nhóm
              </Select.Option>
              <Select.Option value="member">
                Thành viên — Có thể xem và làm việc
              </Select.Option>
              <Select.Option value="viewer">Xem — Chỉ xem</Select.Option>
            </Select>
          </Form.Item>

          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginBottom: 16,
            }}
          >
            Lời mời sẽ được gửi qua email. Người được mời cần xác nhận để tham
            gia nhóm.
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setInviteModal(false);
                inviteForm.resetFields();
                setLookupResult(null);
                setLookupError(null);
              }}
            >
              Huỷ
            </Button>
            <Button type="primary" htmlType="submit" loading={inviting}>
              Gửi lời mời
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
