import { useState } from "react";
import Sidebar from "./Sidebar";
import Main from "./Main";
import "./LayoutDefault.scss";

function LayoutDefault() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={`layout-default ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar onCollapse={setSidebarCollapsed} />
      <div className="main-content-wrapper">
        <Main />
      </div>
    </div>
  );
}

export default LayoutDefault;
