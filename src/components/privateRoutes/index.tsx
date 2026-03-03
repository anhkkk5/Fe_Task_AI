import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../../utils/axios/request";
import { refreshToken, getMe } from "../../services/authServices";

const PrivateRoutes = () => {
  const { isLogin, user } = useSelector((state: any) => state.loginReducer);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      // Nếu đã có token và user data, dùng luôn
      if (token && isLogin && user) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      // Thử refresh token từ cookie
      try {
        await refreshToken();
        // Fetch user data sau khi refresh token thành công
        const userResponse = await getMe();
        const userData = userResponse.user || userResponse;
        dispatch({ type: "CHECK_LOGIN", status: true, payload: userData });
        setIsAuth(true);
      } catch (error) {
        console.log("Session expired or invalid");
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch, isLogin, user]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Đang tải...
      </div>
    );
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoutes;
