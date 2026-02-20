import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../../utils/axios/request";
import { refreshToken } from "../../services/authServices";

const PrivateRoutes = () => {
  const isLoggedIn = useSelector((state: any) => state.loginReducer);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      // Nếu đã có token trong memory, dùng luôn
      if (token && isLoggedIn) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      // Thử refresh token từ cookie
      try {
        await refreshToken();
        dispatch({ type: "CHECK_LOGIN", status: true });
        setIsAuth(true);
      } catch (error) {
        console.log("Session expired or invalid");
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch, isLoggedIn]);

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
