import { useState } from "react";
import Sidebar from "./Sidebar";
import Main from "./Main";
import OnboardingTour from "../../components/OnboardingTour";
import OnboardingMissions from "../../components/OnboardingMissions";
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
      <OnboardingTour />
      <OnboardingMissions />
    </div>
  );
}

export default LayoutDefault;
