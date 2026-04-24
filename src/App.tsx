import "./App.css";
import "./styles/global.scss";
import AllRoute from "./routes";
import { ConfigProvider, App as AntdApp } from "antd";
import Chatbot from "./components/Chatbot";
import { ChatbotProvider } from "./contexts/ChatbotContext";
import { MessengerProvider } from "./contexts/MessengerContext";
import MessengerRoot from "./components/Messenger/MessengerRoot";

// Smile AI-Inspired Theme - Clean Teal Palette
// 60%: #FFFFFF / #F6F7F9 (White / Off-White - Background)
// 30%: #1AA0B0 / #E8F4F6 (Teal - Primary/Accents)
// 10%: #F5EEDB / states (Warm cream accent + state colors)
const appTheme = {
  token: {
    // Primary - Teal
    colorPrimary: "#1AA0B0",
    colorPrimaryHover: "#148F9F",
    colorPrimaryActive: "#0F7985",
    colorPrimaryBg: "#E8F4F6",
    colorPrimaryBgHover: "#B5E0E6",

    // Background
    colorBgLayout: "#F6F7F9",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",

    // Text
    colorText: "#0F172A",
    colorTextSecondary: "#475569",
    colorTextTertiary: "#64748B",

    // Border & Divider - softer
    colorBorder: "#E5E7EB",
    colorBorderSecondary: "#EEF0F3",

    // Border radius - softer, modern
    borderRadius: 10,
    borderRadiusSM: 8,
    borderRadiusLG: 16,
    borderRadiusXS: 6,

    // Font
    fontFamily:
      "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Shadows - airy, very subtle (Smile AI style)
    boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
    boxShadowSecondary: "0 4px 12px -2px rgba(15, 23, 42, 0.06)",
    boxShadowTertiary: "0 8px 24px -6px rgba(15, 23, 42, 0.08)",

    // Control heights
    controlHeight: 40,
    controlHeightLG: 48,
  },
  components: {
    Button: {
      borderRadius: 999, // pill-shape like Smile AI "Đăng Nhập" button
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 600,
      primaryShadow: "0 2px 8px rgba(26, 160, 176, 0.20)",
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
      paddingLG: 28,
    },
    Table: {
      borderRadius: 12,
      headerBorderRadius: 12,
      headerBg: "#F6F7F9",
      headerColor: "#475569",
    },
    Menu: {
      borderRadius: 10,
      itemSelectedBg: "#E8F4F6",
      itemSelectedColor: "#0F7985",
      itemHoverBg: "#F3FAFB",
      itemBorderRadius: 10,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 44,
      activeBorderColor: "#1AA0B0",
      hoverBorderColor: "#5FC1CD",
      activeShadow: "0 0 0 3px rgba(26, 160, 176, 0.12)",
    },
    Select: {
      borderRadius: 10,
      controlHeight: 44,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Badge: {
      colorError: "#EF4444",
      colorSuccess: "#10B981",
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Drawer: {
      borderRadiusLG: 20,
    },
    Tabs: {
      inkBarColor: "#1AA0B0",
      itemSelectedColor: "#0F7985",
      itemHoverColor: "#148F9F",
    },
    Segmented: {
      itemSelectedBg: "#FFFFFF",
      itemSelectedColor: "#0F7985",
      trackBg: "#F3FAFB",
    },
    Progress: {
      defaultColor: "#1AA0B0",
    },
    Switch: {
      colorPrimary: "#1AA0B0",
      colorPrimaryHover: "#148F9F",
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={appTheme}>
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
