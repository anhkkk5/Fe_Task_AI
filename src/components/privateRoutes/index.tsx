import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, setAccessToken } from "../../utils/axios/request";
import { refreshToken, getMe } from "../../services/authServices";
import { checkLogin } from "../../store/slices/authSlice";

const PrivateRoutes = () => {
  const { isLogin, user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (token && isLogin && user) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      try {
        if (!token) {
          await refreshToken();
        }

        const userResponse = await getMe();
        const userData = userResponse.user || userResponse;

        if (userResponse.accessToken) {
          setAccessToken(userResponse.accessToken);
        }

        dispatch(checkLogin({ status: true, user: userData }));
        setIsAuth(true);
      } catch {
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
