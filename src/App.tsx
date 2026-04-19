import "./App.css";
import AllRoute from "./routes";
import { ConfigProvider } from "antd";
import Chatbot from "./components/Chatbot";
import { ChatbotProvider } from "./contexts/ChatbotContext";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <ChatbotProvider>
        <AllRoute />
        <Chatbot />
      </ChatbotProvider>
    </ConfigProvider>
  );
}

export default App;
