// Dashboard API Client
// Handles all API calls for the HR Dashboard

<<<<<<< Updated upstream
// Service URLs - configured via environment variables (use apiBase helper)
import { apiBase } from "./apiBase";

const USER_SERVICE_URL = apiBase("VITE_USER_SERVICE_URL", "http://localhost:8000");
const EMPLOYEE_SERVICE_URL = apiBase(
  "VITE_EMPLOYEE_SERVICE_URL",
  "http://localhost:8001",
);
const ATTENDANCE_SERVICE_URL = apiBase(
  "VITE_ATTENDANCE_SERVICE_URL",
  "http://localhost:8002",
);
const LEAVE_SERVICE_URL = apiBase("VITE_LEAVE_SERVICE_URL", "http://localhost:8003");
const AUDIT_SERVICE_URL = apiBase("VITE_AUDIT_SERVICE_URL", "http://localhost:8004");

// Types
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_number?: string;
  position: string;
  department: string;
  date_of_hire: string;
  contract_type: string;
  salary: string;
}

export interface AttendanceDashboard {
  date: string;
  total_employees: number;
  checked_in: number;
  not_checked_in: number;
  present: number;
  absent: number;
  late: number;
  pending: number;
  records: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: "present" | "absent" | "late" | "pending";
  work_hours?: number;
}

export interface LeaveSummary {
  total_leaves: number;
  pending_leaves: number;
  approved_leaves: number;
  rejected_leaves: number;
  cancelled_leaves: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  days_count?: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  log_type: string;
  entity_type: string;
  entity_id: string;
  service_name: string;
  status: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  employees: Employee[];
  totalEmployees: number;
  attendanceSummary: AttendanceDashboard | null;
  leaveSummary: LeaveSummary | null;
  recentLeaves: LeaveRequest[];
  recentAuditLogs: AuditLog[];
}

// API Helper function
async function fetchWithAuth<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Employee Service API
// Response type for paginated employee list
interface EmployeeListResponse {
  total: number;
  employees: Employee[];
}

export async function getEmployees(
  accessToken: string,
  offset: number = 0,
  limit: number = 100,
): Promise<Employee[]> {
  const response = await fetchWithAuth<EmployeeListResponse>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/employees?offset=${offset}&limit=${limit}`,
    accessToken,
  );
  // API returns { total, employees }, extract the array
  return Array.isArray(response) ? response : (response.employees ?? []);
}

export async function getEmployeeCount(accessToken: string): Promise<number> {
  const employees = await getEmployees(accessToken, 0, 1000);
  return employees.length;
}

// Attendance Service API
export async function getAttendanceDashboard(
  accessToken: string,
  date?: string,
): Promise<AttendanceDashboard> {
  const url = date
<<<<<<< Updated upstream
    ? `${ATTENDANCE_SERVICE_URL}/attendance/dashboard?date=${date}`
    : `${ATTENDANCE_SERVICE_URL}/attendance/dashboard`;
  return fetchWithAuth<AttendanceDashboard>(url, accessToken);
}

export async function getMyAttendanceToday(
  accessToken: string,
): Promise<AttendanceRecord | null> {
  try {
    return await fetchWithAuth<AttendanceRecord>(
<<<<<<< Updated upstream
      `${ATTENDANCE_SERVICE_URL}/attendance/me/today`,
      accessToken,
    );
  } catch {
    return null;
  }
}

// Leave Service API
export async function getLeaveSummary(
  accessToken: string,
): Promise<LeaveSummary> {
  return fetchWithAuth<LeaveSummary>(
<<<<<<< Updated upstream
    `${LEAVE_SERVICE_URL}/leave/dashboard/summary`,
    accessToken,
  );
}

export async function getPendingLeaves(
  accessToken: string,
): Promise<LeaveRequest[]> {
  return fetchWithAuth<LeaveRequest[]>(
<<<<<<< Updated upstream
    `${LEAVE_SERVICE_URL}/leave/pending`,
    accessToken,
  );
}

export async function getMyLeaves(
  accessToken: string,
): Promise<LeaveRequest[]> {
  return fetchWithAuth<LeaveRequest[]>(
<<<<<<< Updated upstream
    `${LEAVE_SERVICE_URL}/leave/me`,
    accessToken,
  );
}

// Audit Service API
export async function getRecentAuditLogs(
  accessToken: string,
  limit: number = 10,
): Promise<AuditLog[]> {
  return fetchWithAuth<AuditLog[]>(
<<<<<<< Updated upstream
    `${AUDIT_SERVICE_URL}/audit-logs?limit=${limit}`,
    accessToken,
  );
}

// Dashboard Data Loader - Loads all data in parallel
export async function loadDashboardData(
  accessToken: string,
): Promise<DashboardData> {
  const results = await Promise.allSettled([
    getEmployees(accessToken, 0, 100),
    getAttendanceDashboard(accessToken),
    getLeaveSummary(accessToken),
    getPendingLeaves(accessToken),
    getRecentAuditLogs(accessToken, 10),
  ]);

  const employees = results[0].status === "fulfilled" ? results[0].value : [];
  const attendanceSummary =
    results[1].status === "fulfilled" ? results[1].value : null;
  const leaveSummary =
    results[2].status === "fulfilled" ? results[2].value : null;
  const recentLeaves =
    results[3].status === "fulfilled" ? results[3].value : [];
  const recentAuditLogs =
    results[4].status === "fulfilled" ? results[4].value : [];

  return {
    employees,
    totalEmployees: attendanceSummary?.total_employees ?? employees.length,
    attendanceSummary,
    leaveSummary,
    recentLeaves,
    recentAuditLogs,
  };
}

// Export service URLs for debugging
export const serviceUrls = {
  user: USER_SERVICE_URL,
  employee: EMPLOYEE_SERVICE_URL,
  attendance: ATTENDANCE_SERVICE_URL,
  leave: LEAVE_SERVICE_URL,
  audit: AUDIT_SERVICE_URL,
};
