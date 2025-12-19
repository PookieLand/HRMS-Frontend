// Employee Management Service API Client
// Handles all READ operations directly to employee-management-service
// Per architecture: reads go directly to employee-service, writes go through user-service

<<<<<<< Updated upstream
import { apiBase } from "./apiBase";

const EMPLOYEE_SERVICE_URL = apiBase(
  "VITE_EMPLOYEE_SERVICE_URL",
  "http://localhost:8001",
);

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Employee {
  id: number;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  job_title: string;
  department: string;
  position?: string;
  manager_id?: number;
  manager_name?: string;
  employment_type: "permanent" | "contract";
  hire_date: string;
  contract_end_date?: string;
  probation_months?: number;
  probation_end_date?: string;
  salary?: number; // Only visible to HR roles
  status: "active" | "suspended" | "terminated" | "on_leave";
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmployeeSummary {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  status: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface EmployeeListParams {
  offset?: number;
  limit?: number;
  department?: string;
  status?: string;
  employment_type?: string;
  search?: string;
}

export interface TeamMember {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  status: string;
}

export interface Team {
  manager: {
    id: number;
    full_name: string;
    job_title: string;
    email: string;
  };
  team_members: TeamMember[];
  team_size: number;
}

export interface HierarchyNode {
  employee: Employee;
  direct_reports: HierarchyNode[];
}

export interface ReportingChain {
  employee: Employee;
  manager?: Employee;
  reporting_chain: Employee[];
}

export interface EmploymentHistoryEntry {
  id: number;
  employee_id: number;
  change_type: string;
  previous_job_title?: string;
  previous_role?: string;
  previous_salary?: number;
  previous_department?: string;
  new_job_title?: string;
  new_role?: string;
  new_salary?: number;
  new_department?: string;
  effective_date: string;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface SalarySummary {
  // Total payroll amount across all employees (e.g., monthly payroll)
  total_payroll: number;
  // Currency code used (optional)
  currency?: string;
  total_employees: number;
  average_salary: number;
  // Breakdown by department if the API provides it
  by_department: Array<{
    department: string;
    total_salary: number;
    average_salary: number;
    employee_count: number;
  }>;
}

export interface HeadcountReport {
  total_employees: number;
  by_department: Array<{
    department: string;
    count: number;
  }>;
  by_role: Array<{
    role: string;
    count: number;
  }>;
  by_employment_type: {
    permanent: number;
    contract: number;
  };
}

export interface ProbationStatusReport {
  employees_on_probation: number;
  employees: Array<{
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    department: string;
    probation_end_date: string;
    days_remaining: number;
  }>;
}

export interface ContractsExpiringReport {
  contracts_expiring: number;
  employees: Array<{
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    department: string;
    contract_end_date: string;
    days_remaining: number;
  }>;
}

export interface Anniversary {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  hire_date: string;
  anniversary_date: string;
  years: number;
}

export interface Birthday {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  date_of_birth: string;
  birthday_date: string;
}

export interface DashboardMetrics {
  total_employees: number;
  active_employees: number;
  on_probation: number;
  contract_employees: number;
  departments: Array<{
    name: string;
    count: number;
  }>;
  employment_types: {
    permanent: number;
    contract: number;
  };
  probation_ending_soon?: number;
  contracts_expiring_soon?: number;
  today_birthdays?: number;
  this_week_anniversaries?: number;
  cache_updated_at?: string;
}

// ============================================================================
// API Helper Functions
// ============================================================================

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
    let errorMessage = `API Error (${response.status})`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || errorText;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// Employee Read Operations
// ============================================================================

/**
 * Get employee by ID
 * RBAC: HR sees all, managers see their team, employees see themselves
 */
export async function getEmployee(
  employeeId: number,
  accessToken: string,
): Promise<Employee> {
  return fetchWithAuth<Employee>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/employees/${employeeId}`,
    accessToken,
  );
}

/**
 * Get current user's employee profile
 */
export async function getMyProfile(accessToken: string): Promise<Employee> {
  return fetchWithAuth<Employee>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/employees/me`,
    accessToken,
  );
}

/**
 * List employees with filtering and pagination
 * RBAC: Filtered based on user role
 */
export async function listEmployees(
  accessToken: string,
  params: EmployeeListParams = {},
): Promise<EmployeeListResponse> {
  const queryParams = new URLSearchParams();

  if (params.offset !== undefined)
    queryParams.append("offset", params.offset.toString());
  if (params.limit !== undefined)
    queryParams.append("limit", params.limit.toString());
  if (params.department) queryParams.append("department", params.department);
  if (params.status) queryParams.append("status", params.status);
  if (params.employment_type)
    queryParams.append("employment_type", params.employment_type);
  if (params.search) queryParams.append("search", params.search);

<<<<<<< Updated upstream
  const url = `${EMPLOYEE_SERVICE_URL}/employees?${queryParams.toString()}`;
  return fetchWithAuth<EmployeeListResponse>(url, accessToken);
}

/**
 * Get employee summary list (for dropdowns)
 */
export async function getEmployeeSummary(
  accessToken: string,
  department?: string,
): Promise<EmployeeSummary[]> {
  const url = department
<<<<<<< Updated upstream
    ? `${EMPLOYEE_SERVICE_URL}/employees/summary?department=${department}`
    : `${EMPLOYEE_SERVICE_URL}/employees/summary`;

  return fetchWithAuth<EmployeeSummary[]>(url, accessToken);
}

/**
 * Search employees by name or email
 */
export async function searchEmployees(
  accessToken: string,
  query: string,
): Promise<Employee[]> {
  return fetchWithAuth<Employee[]>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/employees/search?q=${encodeURIComponent(query)}`,
    accessToken,
  );
}

/**
 * Get employment history for an employee
 */
export async function getEmploymentHistory(
  employeeId: number,
  accessToken: string,
): Promise<EmploymentHistoryEntry[]> {
  return fetchWithAuth<EmploymentHistoryEntry[]>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/employees/${employeeId}/history`,
    accessToken,
  );
}

// ============================================================================
// Team & Hierarchy Operations
// ============================================================================

/**
 * Get team members for a manager
 */
export async function getTeamMembers(
  managerId: number,
  accessToken: string,
): Promise<Team> {
  return fetchWithAuth<Team>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/teams/${managerId}/members`,
    accessToken,
  );
}

/**
 * Get full organizational hierarchy
 * RBAC: HR only
 */
export async function getOrganizationHierarchy(
  accessToken: string,
): Promise<HierarchyNode> {
  return fetchWithAuth<HierarchyNode>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/hierarchy`,
    accessToken,
  );
}

/**
 * Get reporting chain for an employee
 */
export async function getReportingChain(
  employeeId: number,
  accessToken: string,
): Promise<ReportingChain> {
  return fetchWithAuth<ReportingChain>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/hierarchy/${employeeId}`,
    accessToken,
  );
}

// ============================================================================
// Reports & Analytics
// ============================================================================

/**
 * Get salary summary by department
 * RBAC: HR only
 */
export async function getSalarySummary(
  accessToken: string,
  department?: string,
): Promise<SalarySummary> {
  const url = department
<<<<<<< Updated upstream
    ? `${EMPLOYEE_SERVICE_URL}/reports/salary-summary?department=${department}`
    : `${EMPLOYEE_SERVICE_URL}/reports/salary-summary`;

  return fetchWithAuth<SalarySummary>(url, accessToken);
}

/**
 * Get headcount report
 */
export async function getHeadcountReport(
  accessToken: string,
): Promise<HeadcountReport> {
  return fetchWithAuth<HeadcountReport>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/reports/headcount`,
    accessToken,
  );
}

/**
 * Get probation status report
 */
export async function getProbationStatus(
  accessToken: string,
): Promise<ProbationStatusReport> {
  return fetchWithAuth<ProbationStatusReport>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/reports/probation-status`,
    accessToken,
  );
}

/**
 * Get contracts expiring soon
 */
export async function getContractsExpiring(
  accessToken: string,
  days?: number,
): Promise<ContractsExpiringReport> {
  const url = days
<<<<<<< Updated upstream
    ? `${EMPLOYEE_SERVICE_URL}/reports/contracts-expiring?days=${days}`
    : `${EMPLOYEE_SERVICE_URL}/reports/contracts-expiring`;

  return fetchWithAuth<ContractsExpiringReport>(url, accessToken);
}

/**
 * Get upcoming work anniversaries
 */
export async function getUpcomingAnniversaries(
  accessToken: string,
  days?: number,
): Promise<Anniversary[]> {
  const url = days
<<<<<<< Updated upstream
    ? `${EMPLOYEE_SERVICE_URL}/reports/anniversaries?days=${days}`
    : `${EMPLOYEE_SERVICE_URL}/reports/anniversaries`;

  return fetchWithAuth<Anniversary[]>(url, accessToken);
}

/**
 * Get upcoming birthdays
 */
export async function getUpcomingBirthdays(
  accessToken: string,
  days?: number,
): Promise<Birthday[]> {
  const url = days
<<<<<<< Updated upstream
    ? `${EMPLOYEE_SERVICE_URL}/reports/birthdays?days=${days}`
    : `${EMPLOYEE_SERVICE_URL}/reports/birthdays`;

  return fetchWithAuth<Birthday[]>(url, accessToken);
}

// ============================================================================
// Dashboard Metrics
// ============================================================================

/**
 * Get dashboard metrics (cached)
 */
export async function getDashboardMetrics(
  accessToken: string,
): Promise<DashboardMetrics> {
  return fetchWithAuth<DashboardMetrics>(
<<<<<<< Updated upstream
    `${EMPLOYEE_SERVICE_URL}/dashboard/metrics`,
    accessToken,
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get unique departments from employee list
 */
export function getUniqueDepartments(employees: Employee[]): string[] {
  const departments = new Set(employees.map((e) => e.department));
  return Array.from(departments).sort();
}

/**
 * Format salary for display
 */
export function formatSalary(
  salary: number | undefined,
  currency: string = "USD",
): string {
  if (salary === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(salary);
}

/**
 * Calculate employment duration
 */
export function calculateEmploymentDuration(hireDate: string): string {
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}, ${months} month${months > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "green";
    case "suspended":
      return "yellow";
    case "terminated":
      return "red";
    case "on_leave":
      return "blue";
    default:
      return "gray";
  }
}

/**
 * Check if user can see salary data
 */
export function canSeeSalary(userRoles: string[]): boolean {
  return userRoles.some(
    (role) =>
      role.includes("HR_Admin") ||
      role.includes("HR_Manager") ||
      role.includes("HR_Administrators") ||
      role.includes("HR_Managers"),
  );
}

// Export service URL for debugging
export const employeeServiceUrl = EMPLOYEE_SERVICE_URL;
