import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAccessToken } from "../../utils/axios/request";

function PrivateRoutes() {
  const isLoggedIn = useSelector((state: any) => state.loginReducer);
  const accessToken = getAccessToken();

  // Kiểm tra cả Redux state và access token trong memory
  return isLoggedIn && accessToken ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default PrivateRoutes;
