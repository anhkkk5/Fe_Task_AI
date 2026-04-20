import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Badge, Dropdown, Tooltip } from "antd";
import {
  CheckSquareOutlined,
  TeamOutlined,
  CalendarOutlined,
  BellOutlined,
  RobotOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  StarFilled,
} from "@ant-design/icons";
import { clearAccessToken } from "../../utils/axios/request";
import { logout } from "../../store/slices/authSlice";
import "./Sidebar.scss";

const menuItems = [
  {
    key: "/tasks",
    icon: <CheckSquareOutlined />,
    label: "Công việc",
    badge: null,
  },
  {
    key: "/teams",
    icon: <TeamOutlined />,
    label: "Nhóm",
    badge: null,
  },
  {
    key: "/calendar",
    icon: <CalendarOutlined />,
    label: "Lịch",
    badge: null,
  },
  {
    key: "/notifications",
    icon: <BellOutlined />,
    label: "Thông báo",
    badge: 5,
  },
  {
    key: "/chat",
    icon: <RobotOutlined />,
    label: "Chat AI",
    badge: null,
    ai: true,
  },
];

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

function Sidebar({ onCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state: any) => state.auth);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapse?.(newState);
  };

  const handleMenuClick = (key: string) => {
    if (key === "logout") {
      clearAccessToken();
      dispatch(logout());
      navigate("/login");
    } else if (key === "profile") {
      navigate("/profile");
    } else if (key === "settings") {
      navigate("/settings");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo Section */}
      <div className="sidebar-logo">
        <Link to="/" className="logo-link">
          <div
            className="logo-icon-wrapper"
            onClick={collapsed ? toggleCollapse : undefined}
            style={collapsed ? { cursor: "pointer" } : undefined}
            title={collapsed ? "Mở rộng sidebar" : undefined}
          >
            <StarFilled className="logo-sparkle" />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-brand">TaskMind</span>
              <span className="logo-ai">AI</span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button className="collapse-btn" onClick={toggleCollapse}>
            <MenuFoldOutlined />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Tooltip
            key={item.key}
            title={collapsed ? item.label : null}
            placement="right"
          >
            <Link
              to={item.key}
              className={`nav-item ${isActive(item.key) ? "active" : ""}`}
            >
              <div className="nav-icon">
                {item.icon}
                {item.badge && (
                  <Badge
                    count={item.badge}
                    size="small"
                    className="nav-badge"
                  />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.ai && (
                    <span className="ai-indicator">
                      <StarFilled />
                    </span>
                  )}
                </>
              )}
            </Link>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Section - User */}
      <div className="sidebar-footer">
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: (e) => handleMenuClick(e.key),
          }}
          placement="topRight"
          trigger={["click"]}
        >
          <div className="user-menu">
            <Avatar
              size={collapsed ? 32 : 38}
              src={user?.avatar}
              className="user-avatar"
              style={{
                backgroundColor: user?.avatar
                  ? undefined
                  : "var(--color-primary-blue)",
              }}
            >
              {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || "U")}
            </Avatar>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name || "Người dùng"}</span>
                <span className="user-role">Premium</span>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </aside>
  );
}

export default Sidebar;
