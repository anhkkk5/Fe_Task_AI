import LayoutDefault from "../layouts/LayoutDefault";
import PrivateRoutes from "../components/privateRoutes";
import { Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";
import ForgotPassword from "../pages/ForgotPassword";
import Profile from "../pages/Profile";
import Tasks from "../pages/Tasks";
import Teams from "../pages/Teams";
import TeamDetail from "../pages/Teams/TeamDetail";
import AcceptInvite from "../pages/Teams/AcceptInvite";
import Calendar from "../pages/Calendar";
import Notifications from "../pages/Notifications";
import Chat from "../pages/Chat";
import Messenger from "../pages/Messenger";
import Guide from "../pages/Guide";
import GoogleCallback from "../pages/GoogleCallback";

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
  {
    path: "/auth/google/callback",
    element: <GoogleCallback />,
  },
  // Public invite accept route (no layout)
  {
    path: "/teams/invite",
    element: <AcceptInvite />,
  },
  {
    path: "/teams/invite/accept",
    element: <AcceptInvite />,
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
            element: <Navigate to="/tasks" replace />,
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
            path: "teams/:id",
            element: <TeamDetail />,
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
          {
            path: "messenger",
            element: <Messenger />,
          },
          {
            path: "guide",
            element: <Guide />,
          },
        ],
      },
    ],
  },
];
