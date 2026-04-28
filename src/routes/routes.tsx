import { lazy, Suspense, type ReactNode } from "react";
import LayoutDefault from "../layouts/LayoutDefault";
import PrivateRoutes from "../components/privateRoutes";
import { Navigate } from "react-router-dom";

// Lazy-loaded pages — each becomes its own JS chunk so the initial bundle
// only contains Login + Layout. Other routes download on demand, which is
// critical on slow mobile networks and on Vercel/Render cold starts.
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const VerifyOtp = lazy(() => import("../pages/VerifyOtp"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const Profile = lazy(() => import("../pages/Profile"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Teams = lazy(() => import("../pages/Teams"));
const TeamDetail = lazy(() => import("../pages/Teams/TeamDetail"));
const AcceptInvite = lazy(() => import("../pages/Teams/AcceptInvite"));
const Calendar = lazy(() => import("../pages/Calendar"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Chat = lazy(() => import("../pages/Chat"));
const Messenger = lazy(() => import("../pages/Messenger"));
const Guide = lazy(() => import("../pages/Guide"));
const GoogleCallback = lazy(() => import("../pages/GoogleCallback"));

// Minimal Suspense fallback. Full-screen spinner intentionally avoided —
// most chunks download in <300ms on 4G, a flash of spinner is more
// distracting than a brief blank.
const PageFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
      color: "#64748B",
    }}
  >
    Đang tải...
  </div>
);

const withSuspense = (node: ReactNode): ReactNode => (
  <Suspense fallback={<PageFallback />}>{node}</Suspense>
);

export const routes = [
  // Auth routes - Full screen, no LayoutDefault
  { path: "/login", element: withSuspense(<Login />) },
  { path: "/register", element: withSuspense(<Register />) },
  { path: "/verify-otp", element: withSuspense(<VerifyOtp />) },
  { path: "/forgot-password", element: withSuspense(<ForgotPassword />) },
  { path: "/auth/google/callback", element: withSuspense(<GoogleCallback />) },
  // Public invite accept route (no layout)
  { path: "/teams/invite", element: withSuspense(<AcceptInvite />) },
  { path: "/teams/invite/accept", element: withSuspense(<AcceptInvite />) },
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
          { path: "profile", element: withSuspense(<Profile />) },
          { path: "tasks", element: withSuspense(<Tasks />) },
          { path: "teams", element: withSuspense(<Teams />) },
          { path: "teams/:id", element: withSuspense(<TeamDetail />) },
          { path: "calendar", element: withSuspense(<Calendar />) },
          { path: "notifications", element: withSuspense(<Notifications />) },
          { path: "chat", element: withSuspense(<Chat />) },
          { path: "messenger", element: withSuspense(<Messenger />) },
          { path: "guide", element: withSuspense(<Guide />) },
        ],
      },
    ],
  },
];
