import "./App.css";
import AllRoute from "./routes";
import { ConfigProvider } from "antd";

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
      <AllRoute />
    </ConfigProvider>
  );
}

export default App;
