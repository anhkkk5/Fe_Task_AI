import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Badge, Dropdown } from "antd";
import { clearAccessToken } from "../../utils/axios/request";

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state: any) => state.loginReducer);

  const handleMenuClick = (key: string) => {
    if (key === "logout") {
      clearAccessToken();
      dispatch({ type: "CHECK_LOGIN", status: false });
      navigate("/login");
    } else if (key === "profile") {
      navigate("/profile");
    }
  };

  const userMenuItems = [
    { key: "profile", label: "Hồ sơ" },
    { key: "settings", label: "Cài đặt" },
    { type: "divider" as const },
    { key: "logout", label: "Đăng xuất", danger: true },
  ];

  const menuProps = {
    items: userMenuItems,
    onClick: (e: { key: string }) => handleMenuClick(e.key),
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">▲</span>
          <span className="logo-text">TaskMind AI</span>
        </div>
        <nav className="main-nav">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Dashboard
          </Link>
          <Link
            to="/tasks"
            className={`nav-link ${isActive("/tasks") ? "active" : ""}`}
          >
            Công việc AI
          </Link>
          <Link
            to="/teams"
            className={`nav-link ${isActive("/teams") ? "active" : ""}`}
          >
            Nhóm
          </Link>
          <Link
            to="/calendar"
            className={`nav-link ${isActive("/calendar") ? "active" : ""}`}
          >
            Lịch
          </Link>
          <Link
            to="/notifications"
            className={`nav-link ${isActive("/notifications") ? "active" : ""}`}
          >
            Thông báo
            <Badge count={5} size="small" style={{ marginLeft: 4 }} />
          </Link>
        </nav>
      </div>
      <div className="header-right">
        <Dropdown menu={menuProps} placement="bottomRight">
          <div className="user-menu">
            <Avatar
              size="small"
              src={user?.avatar}
              style={{ backgroundColor: user?.avatar ? undefined : "#4a90e2" }}
            >
              {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || "N")}
            </Avatar>
            <span className="user-name">{user?.name || "Người dùng"}</span>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}

export default Header;
