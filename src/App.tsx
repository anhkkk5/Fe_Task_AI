import "./App.css";
import "./styles/global.scss";
import AllRoute from "./routes";
import { ConfigProvider, App as AntdApp } from "antd";
import Chatbot from "./components/Chatbot";
import { ChatbotProvider } from "./contexts/ChatbotContext";
import { MessengerProvider } from "./contexts/MessengerContext";
import MessengerRoot from "./components/Messenger/MessengerRoot";

// MongoDB-Style Theme - 60-30-10 Rule
// 60%: #FFFFFF / #F5F7FA (White/Light Gray - Background)
// 30%: #0066CC / #E6F0FF (Soft Blue - Accents)
// 10%: #10B981 / #F59E0B / #EF4444 (State colors)
const mongoTheme = {
  token: {
    // Primary colors - MongoDB Soft Blue
    colorPrimary: "#0066CC",
    colorPrimaryHover: "#1A73E8",
    colorPrimaryActive: "#0052A3",
    colorPrimaryBg: "#E6F0FF",
    colorPrimaryBgHover: "#B3D9FF",

    // Background colors
    colorBgLayout: "#F5F7FA",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",

    // Text colors
    colorText: "#3C4043",
    colorTextSecondary: "#5F6368",
    colorTextTertiary: "#70757A",

    // Border & Divider
    colorBorder: "#D1D5DB",
    colorBorderSecondary: "#E8ECEF",

    // Border radius - clean, minimal
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 12,

    // Font
    fontFamily:
      "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Shadows - subtle
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.06)",
    boxShadowSecondary: "0 4px 8px -2px rgba(0, 0, 0, 0.08)",
    boxShadowTertiary: "0 8px 16px -4px rgba(0, 0, 0, 0.08)",
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 38,
      colorPrimary: "#0066CC",
      colorPrimaryHover: "#1A73E8",
    },
    Card: {
      borderRadius: 10,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    Table: {
      borderRadius: 8,
      headerBorderRadius: 8,
      headerBg: "#F5F7FA",
    },
    Menu: {
      borderRadius: 8,
      itemSelectedBg: "#E6F0FF",
      itemSelectedColor: "#0066CC",
    },
    Input: {
      borderRadius: 8,
      activeBorderColor: "#0066CC",
      hoverBorderColor: "#4D94FF",
    },
    Select: {
      borderRadius: 8,
    },
    Tag: {
      borderRadius: 4,
    },
    Badge: {
      colorError: "#EF4444",
      colorSuccess: "#10B981",
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={mongoTheme}>
      <AntdApp>
        <ChatbotProvider>
          <MessengerProvider>
            <AllRoute />
            <Chatbot />
            <MessengerRoot />
          </MessengerProvider>
        </ChatbotProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
