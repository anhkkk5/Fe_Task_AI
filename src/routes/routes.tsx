import LayoutDefault from "../layouts/LayoutDefault";
import PrivateRoutes from "../components/privateRoutes";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";
import ForgotPassword from "../pages/ForgotPassword";
import Profile from "../pages/Profile";
import Tasks from "../pages/Tasks";
import Teams from "../pages/Teams";
import Calendar from "../pages/Calendar";
import Notifications from "../pages/Notifications";
import Chat from "../pages/Chat";

export const routes = [
  // Auth routes - Full screen, no LayoutDefault
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtp />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  // Main app routes with LayoutDefault
  {
    path: "/",
    element: <LayoutDefault />,
    children: [
      // Protected routes
      {
        element: <PrivateRoutes />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "profile",
            element: <Profile />,
          },
          {
            path: "tasks",
            element: <Tasks />,
          },
          {
            path: "teams",
            element: <Teams />,
          },
          {
            path: "calendar",
            element: <Calendar />,
          },
          {
            path: "notifications",
            element: <Notifications />,
          },
          {
            path: "chat",
            element: <Chat />,
          },
        ],
      },
    ],
  },
];
