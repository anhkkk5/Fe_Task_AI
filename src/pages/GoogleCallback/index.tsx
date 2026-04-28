import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import { useDispatch } from "react-redux";
import { getMe } from "../../services/authServices";
import { checkLogin } from "../../store/slices/authSlice";
import { clearAccessToken, setAccessToken } from "../../utils/axios/request";

function GoogleCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const error = urlParams.get("error");
    const tokenFromHash = hashParams.get("token");

    if (error) {
      message.error(`Đăng nhập thất bại: ${error}`);
      navigate("/login", { replace: true });
    } else {
      // CRITICAL: Clear old memory token to ensure cookie is used
      clearAccessToken();
      localStorage.removeItem("token");

      if (tokenFromHash) {
        setAccessToken(tokenFromHash);
        localStorage.setItem("token", tokenFromHash);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      getMe()
        .then((res) => {
          const accessToken = res.accessToken;
          const userData = res.user || res;

          if (accessToken) {
            setAccessToken(accessToken);
          }

          dispatch(checkLogin({ status: true, user: userData }));
          message.success("Đăng nhập Google thành công!");
          const redirectPath = sessionStorage.getItem("post_login_redirect");
          if (redirectPath) {
            sessionStorage.removeItem("post_login_redirect");
            navigate(redirectPath, { replace: true });
            return;
          }

          navigate("/tasks", { replace: true });
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
