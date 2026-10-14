import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { setAccessToken } from "../../utils/axios/request";
import { refreshToken, getMe } from "../../services/authServices";
import { checkLogin } from "../../store/slices/authSlice";

const PrivateRoutes = () => {
  const { isLogin, user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (isLogin && user) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      try {
        let userData: any = null;
        try {
          // 1. Verify session directly via HttpOnly cookie
          const userResponse = await getMe();
          userData = userResponse.user || userResponse;
          if (userResponse.accessToken) {
            setAccessToken(userResponse.accessToken);
          }
        } catch {
          // 2. If token cookie is expired, attempt silent refresh via refreshToken cookie
          try {
            const refreshRes = await refreshToken();
            if (refreshRes?.accessToken) {
              setAccessToken(refreshRes.accessToken);
            }
            const userResponse = await getMe();
            userData = userResponse.user || userResponse;
          } catch {
            userData = null;
          }
        }

        if (userData && (userData.id || userData._id || userData.email)) {
          dispatch(checkLogin({ status: true, user: userData }));
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
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
