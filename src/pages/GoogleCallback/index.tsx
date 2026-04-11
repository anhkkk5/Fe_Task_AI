import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import { useDispatch } from "react-redux";
import { getMe } from "../../services/authServices";
import { checkLogin } from "../../store/slices/authSlice";
import { clearAccessToken } from "../../utils/axios/request";

function GoogleCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      message.error(`Đăng nhập thất bại: ${error}`);
      navigate("/login", { replace: true });
    } else {
      // CRITICAL: Clear old memory token to ensure cookie is used
      clearAccessToken();
      localStorage.removeItem("token");

      // httpOnly cookie is set by backend, fetch user info
      getMe()
        .then((res) => {
          dispatch(checkLogin({ status: true, user: res.user }));
          message.success("Đăng nhập Google thành công!");
          navigate("/calendar", { replace: true });
        })
        .catch(() => {
          message.error("Không thể lấy thông tin người dùng");
          navigate("/login", { replace: true });
        });
    }
  }, [navigate, dispatch]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Spin size="large" />
      <div>Đang xử lý đăng nhập Google...</div>
    </div>
  );
}

export default GoogleCallback;
