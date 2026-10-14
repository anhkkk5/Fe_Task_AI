import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Table,
  Tag,
  Avatar,
  Button,
  Input,
  Select,
  Popconfirm,
  Result,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SafetyCertificateOutlined,
  UserOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  ScheduleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getAdminDashboardStats,
  getAdminUsers,
  updateAdminUserRole,
  toggleAdminUserBan,
  type AdminUserItem,
  type AdminDashboardStats,
} from "../../services/adminServices";
import "./Admin.scss";

const { Option } = Select;

export default function Admin() {
  const { user: currentUser } = useSelector((state: any) => state.auth);

  // States
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter & Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const isAdmin = currentUser?.role === "admin";

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getAdminDashboardStats();
      if (res?.stats) {
        setStats(res.stats);
      }
    } catch {
      // Ignore stats error if any
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        role: selectedRole === "all" ? undefined : selectedRole,
      });

      if (res?.users) {
        setUsers(res.users);
        setTotal(res.pagination?.total || res.users.length);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin, page, pageSize, selectedRole]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    try {
      const res = await updateAdminUserRole(userId, newRole);
      message.success(res?.message || `Đã chuyển vai trò thành ${newRole === "admin" ? "Quản trị viên" : "Thành viên"}`);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Cập nhật vai trò thất bại");
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      const res = await toggleAdminUserBan(userId);
      const isBanned = res?.isBanned;
      message.success(isBanned ? "Đã khóa tài khoản người dùng" : "Đã mở khóa tài khoản người dùng");
      fetchUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Thao tác khóa/mở khóa thất bại");
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "60px 24px", maxWidth: 600, margin: "0 auto" }}>
        <Result
          status="403"
          title="Truy cập bị từ chối"
          subTitle="Tính năng này chỉ dành riêng cho tài khoản Quản trị viên (Admin). Bạn không có quyền truy cập."
          extra={
            <Link to="/tasks">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                Quay về Công việc
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const columns: ColumnsType<AdminUserItem> = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <div className="user-info-cell">
          <Avatar
            size={40}
            src={record.avatar}
            className="user-avatar-wrap"
            style={{
              backgroundColor: record.role === "admin" ? "#7c3aed" : "#2563eb",
            }}
          >
            {record.name ? record.name.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <div className="user-name-wrap">
            <span className="name-row">
              {record.name || "Chưa đặt tên"}
              {record.role === "admin" && (
                <Tooltip title="Quản trị viên hệ thống">
                  <CrownOutlined style={{ color: "#eab308", fontSize: 13 }} />
                </Tooltip>
              )}
            </span>
            <span className="email-text">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 140,
      render: (_, record) => {
        if (record.role === "admin") {
          return (
            <Tag color="purple" style={{ fontWeight: 600, padding: "2px 8px" }}>
              <CrownOutlined /> Admin
            </Tag>
          );
        }
        return (
          <Tag color="blue" style={{ fontWeight: 500, padding: "2px 8px" }}>
            <UserOutlined /> Thành viên
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => {
        if (record.isBanned) {
          return (
            <Tag color="error" style={{ fontWeight: 600 }}>
              <LockOutlined /> Đã bị khóa
            </Tag>
          );
        }
        return (
          <Tag color="success" style={{ fontWeight: 500 }}>
            <CheckCircleOutlined /> Hoạt động
          </Tag>
        );
      },
    },
    {
      title: "Ngày tham gia",
      key: "createdAt",
      width: 160,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {record.createdAt ? dayjs(record.createdAt).format("DD/MM/YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => {
        const isSelf = record._id === (currentUser?._id || currentUser?.id);
        const targetRole = record.role === "admin" ? "user" : "admin";

        return (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {/* Phân quyền */}
            <Popconfirm
              title={
                targetRole === "admin"
                  ? `Nâng quyền cho "${record.name}" thành Quản trị viên (Admin)?`
                  : `Hạ quyền của "${record.name}" xuống Thành viên bình thường?`
              }
              onConfirm={() => handleRoleChange(record._id, targetRole)}
              okText="Đồng ý"
              cancelText="Hủy"
              disabled={isSelf}
            >
              <Button
                size="small"
                disabled={isSelf}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                {targetRole === "admin" ? "Cấp Admin" : "Hạ quyền"}
              </Button>
            </Popconfirm>

            {/* Khóa / Mở khóa */}
            <Popconfirm
              title={
                record.isBanned
                  ? `Mở khóa tài khoản cho "${record.name}"?`
                  : `Khóa tài khoản của "${record.name}"? Người dùng này sẽ không thể đăng nhập.`
              }
              onConfirm={() => handleToggleBan(record._id)}
              okText="Xác nhận"
              cancelText="Hủy"
              disabled={isSelf}
              okButtonProps={{ danger: !record.isBanned }}
            >
              <Button
                size="small"
                danger={!record.isBanned}
                type={record.isBanned ? "primary" : "default"}
                disabled={isSelf}
                icon={record.isBanned ? <UnlockOutlined /> : <LockOutlined />}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                {record.isBanned ? "Mở khóa" : "Khóa"}
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-row">
          <div className="title-left">
            <div className="admin-badge-icon">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <h1 className="title-text">Trung tâm Quản trị Hệ thống</h1>
              <p className="subtitle-text">
                Quản lý danh sách tài khoản người dùng, phân quyền quản trị và giám sát hoạt động
              </p>
            </div>
          </div>
          <div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchStats();
                fetchUsers();
              }}
              loading={loading || statsLoading}
              style={{ borderRadius: 8 }}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap blue">
            <TeamOutlined />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng người dùng</div>
            <div className="stat-value">{stats?.users?.total ?? users.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap purple">
            <CrownOutlined />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tài khoản Quản trị</div>
            <div className="stat-value">
              {users.filter((u) => u.role === "admin").length || 1}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap green">
            <UserOutlined />
          </div>
          <div className="stat-info">
            <div className="stat-label">Đăng ký mới hôm nay</div>
            <div className="stat-value">{stats?.users?.today ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap amber">
            <ScheduleOutlined />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng công việc hệ thống</div>
            <div className="stat-value">{stats?.tasks?.total ?? 0}</div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="admin-table-section">
        <div className="table-toolbar">
          <div className="search-filter-group">
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              className="admin-search-input"
            />
            <Button type="primary" onClick={handleSearch} style={{ borderRadius: 8 }}>
              Tìm kiếm
            </Button>
            <Select
              value={selectedRole}
              onChange={(val) => {
                setSelectedRole(val);
                setPage(1);
              }}
              className="admin-role-select"
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="admin">Quản trị viên (Admin)</Option>
              <Option value="user">Thành viên (User)</Option>
            </Select>
          </div>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, pSize) => {
              setPage(p);
              setPageSize(pSize);
            },
            showTotal: (totalCount) => `Tổng cộng ${totalCount} người dùng`,
          }}
        />
      </div>
    </div>
  );
}
