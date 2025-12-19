import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AsgardeoProvider } from "@asgardeo/react";
import { CLIENT_ID, ORG_BASE_URL } from "./lib/config";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { AlertProvider } from "./contexts/AlertContext.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";

import App from "./App.tsx";
import LoginPage from "./pages/login.tsx";
import ErrorRoutePage from "./pages/error-route.tsx";
import NotFoundPage from "./pages/404.tsx";
import ProfilePage from "./pages/profile.tsx";
import JWTTokenPage from "./pages/jwt-token.tsx";
import RouterErrorComponent from "./components/router-error.tsx";
import SignUpPage from "./pages/signup.tsx";
import Dashboard from "./pages/dashboard/dashboard.tsx";
import UsersPage from "./pages/dashboard/users/index.tsx";
import OnboardPageOld from "./pages/dashboard/users/onboard.tsx";
import EmployeeSignupPage from "./pages/employee-signup.tsx";
import EmployeesDirectory from "./pages/dashboard/employees/index.tsx";
import EmployeeDetail from "./pages/dashboard/employees/[id].tsx";
import EmployeeReports from "./pages/dashboard/employees/reports.tsx";
import EmployeeOnboardPage from "./pages/dashboard/employees/onboard.tsx";
import OnboardingStatusPage from "./pages/dashboard/employees/onboarding.tsx";
import AttendancePage from "./pages/dashboard/attendance/index.tsx";
import TeamAttendancePage from "./pages/dashboard/attendance/team.tsx";
import LeavePage from "./pages/dashboard/leave/index.tsx";
import LeaveApprovalsPage from "./pages/dashboard/leave/approvals.tsx";
import AuditPage from "./pages/dashboard/governance/audit.tsx";
import CompliancePage from "./pages/dashboard/governance/compliance.tsx";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: NotFoundPage,
  errorComponent: RouterErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "HRMS - Home";
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Login - HRMS";
  },
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignUpPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Sign Up - HRMS";
  },
});

const employeeSignupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employee-signup",
  component: EmployeeSignupPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Complete Your Registration - HRMS";
  },
});

const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/error",
  component: ErrorRoutePage,
  beforeLoad: () => {
    document.title = "Error - HRMS";
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Profile - HRMS";
  },
});

const jwtTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jwt-token",
  component: JWTTokenPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "JWT Token - HRMS";
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFoundPage,
  beforeLoad: () => {
    document.title = "404 Not Found - HRMS";
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Dashboard - HRMS";
  },
});

// Legacy user routes (kept for backwards compatibility)
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/users",
  component: UsersPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "User Management - HRMS";
  },
});

const onboardRouteOld = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/users/onboard",
  component: OnboardPageOld,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Onboard Employee - HRMS";
  },
});

// Employee routes
const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/employees",
  component: EmployeesDirectory,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Employees - HRMS";
  },
});

const employeeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/employees/$id",
  component: EmployeeDetail,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Employee Details - HRMS";
  },
});

// New employee onboard route (under employees section)
const employeeOnboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/employees/onboard",
  component: EmployeeOnboardPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Onboard Employee - HRMS";
  },
});

// New onboarding status route (under employees section)
const onboardingStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/employees/onboarding",
  component: OnboardingStatusPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Onboarding Status - HRMS";
  },
});

const employeeReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/employees/reports",
  component: EmployeeReports,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Employee Reports - HRMS";
  },
});

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/attendance",
  component: AttendancePage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "My Attendance - HRMS";
  },
});

const teamAttendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/attendance/team",
  component: TeamAttendancePage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Team Attendance - HRMS";
  },
});

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/leave",
  component: LeavePage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "My Leaves - HRMS";
  },
});

const leaveApprovalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/leave/approvals",
  component: LeaveApprovalsPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Leave Approvals - HRMS";
  },
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/governance/audit",
  component: AuditPage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Audit Logs - HRMS";
  },
});

const complianceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/governance/compliance",
  component: CompliancePage,
  errorComponent: RouterErrorComponent,
  beforeLoad: () => {
    document.title = "Compliance Center - HRMS";
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  errorRoute,
  profileRoute,
  jwtTokenRoute,
  notFoundRoute,
  signupRoute,
  employeeSignupRoute,
  dashboardRoute,
  // Legacy user routes
  usersRoute,
  onboardRouteOld,
  // Employee routes
  employeesRoute,
  employeeDetailRoute,
  employeeOnboardRoute,
  onboardingStatusRoute,
  employeeReportsRoute,
  // Attendance routes
  attendanceRoute,
  teamAttendanceRoute,
  // Leave routes
  leaveRoute,
  leaveApprovalsRoute,
  // Governance routes
  auditRoute,
  complianceRoute,
]);

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFoundPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AsgardeoProvider
        clientId={import.meta.env.VITE_CLIENT_ID || ""}
        baseUrl={import.meta.env.VITE_ORG_BASE_URL || ""}
        scopes={["openid", "profile", "email", "groups"]}
      >
        <AlertProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </AlertProvider>
      </AsgardeoProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
