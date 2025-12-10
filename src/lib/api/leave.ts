import { useAsgardeo } from "@asgardeo/react";

const LEAVE_SERVICE_URL =
  import.meta.env.VITE_LEAVE_SERVICE_URL || "http://localhost:8004/api/v1";

export interface LeaveRequest {
  employee_id: string;
  leave_type:
    | "annual"
    | "sick"
    | "casual"
    | "maternity"
    | "paternity"
    | "unpaid"
    | "other";
  start_date: string;
  end_date: string;
  reason: string;
  contact_info?: string;
  documents?: string[];
}

export interface LeaveRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  leave_type:
    | "annual"
    | "sick"
    | "casual"
    | "maternity"
    | "paternity"
    | "unpaid"
    | "other";
  start_date: string;
  end_date: string;
  return_date: string;
  number_of_days: number;
  reason: string;
  contact_info?: string;
  documents?: string[];
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveApprovalRequest {
  leave_id: string;
  action: "approve" | "reject";
  reason?: string;
}

export interface LeaveBalance {
  employee_id: string;
  leave_type: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  year: number;
}

export interface LeaveSummary {
  employee_id: string;
  year: number;
  total_leaves_taken: number;
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  by_type: Record<string, number>;
  balances: LeaveBalance[];
}

export interface LeaveCalendarEvent {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  number_of_days: number;
}

export interface TeamLeaveCalendar {
  month: number;
  year: number;
  events: LeaveCalendarEvent[];
  total_on_leave_today: number;
}

export interface LeaveDashboardMetrics {
  pending_requests: number;
  approved_this_month: number;
  rejected_this_month: number;
  employees_on_leave_today: number;
  leave_trends: Array<{
    month: string;
    total_leaves: number;
    by_type: Record<string, number>;
  }>;
}

export interface LeavePolicy {
  id: string;
  leave_type: string;
  annual_allocation: number;
  carry_forward_allowed: boolean;
  max_carry_forward: number;
  min_notice_days: number;
  max_consecutive_days: number;
  requires_approval: boolean;
  requires_documents: boolean;
  description: string;
}

export class LeaveAPI {
  private baseUrl: string;
  private getToken: () => Promise<string>;

  constructor(getToken: () => Promise<string>) {
    this.baseUrl = LEAVE_SERVICE_URL;
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        error.message || `Request failed with status ${response.status}`,
      );
    }

    return response.json();
  }

  // Leave application
  async applyLeave(data: LeaveRequest): Promise<LeaveRecord> {
    return this.request<LeaveRecord>("/leave/apply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelLeave(
    leaveId: string,
    reason?: string,
  ): Promise<{ message: string }> {
    return this.request(`/leave/${leaveId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Get leave records
  async getMyLeaves(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    leaves: LeaveRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/leave/my-leaves?${query.toString()}`);
  }

  async getLeaveById(leaveId: string): Promise<LeaveRecord> {
    return this.request(`/leave/${leaveId}`);
  }

  async getEmployeeLeaves(
    employeeId: string,
    params?: {
      status?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<{
    leaves: LeaveRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/leave/employee/${employeeId}?${query.toString()}`);
  }

  // Leave approval (for managers/HR)
  async getPendingApprovals(params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    leaves: LeaveRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/leave/approvals/pending?${query.toString()}`);
  }

  async approveLeave(leaveId: string, notes?: string): Promise<LeaveRecord> {
    return this.request(`/leave/${leaveId}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async rejectLeave(leaveId: string, reason: string): Promise<LeaveRecord> {
    return this.request(`/leave/${leaveId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Leave balance
  async getMyBalance(year?: number): Promise<LeaveSummary> {
    const query = year ? `?year=${year}` : "";
    return this.request(`/leave/my-balance${query}`);
  }

  async getEmployeeBalance(
    employeeId: string,
    year?: number,
  ): Promise<LeaveSummary> {
    const query = year ? `?year=${year}` : "";
    return this.request(`/leave/employee/${employeeId}/balance${query}`);
  }

  // Calendar and team views
  async getMyCalendar(
    month?: number,
    year?: number,
  ): Promise<LeaveCalendarEvent[]> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());

    return this.request(`/leave/my-calendar?${query.toString()}`);
  }

  async getTeamCalendar(
    month?: number,
    year?: number,
  ): Promise<TeamLeaveCalendar> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());

    return this.request(`/leave/team-calendar?${query.toString()}`);
  }

  async getOrganizationCalendar(
    month?: number,
    year?: number,
  ): Promise<LeaveCalendarEvent[]> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());

    return this.request(`/leave/organization-calendar?${query.toString()}`);
  }

  async getEmployeesOnLeaveToday(): Promise<
    Array<{
      employee_id: string;
      employee_name: string;
      leave_type: string;
      return_date: string;
    }>
  > {
    return this.request("/leave/on-leave-today");
  }

  // Dashboard metrics (for HR/managers)
  async getDashboardMetrics(): Promise<LeaveDashboardMetrics> {
    return this.request("/leave/metrics/dashboard");
  }

  async getLeaveTrends(months: number = 6): Promise<
    Array<{
      month: string;
      total_leaves: number;
      by_type: Record<string, number>;
    }>
  > {
    return this.request(`/leave/metrics/trends?months=${months}`);
  }

  // Policies
  async getLeavePolicies(): Promise<LeavePolicy[]> {
    return this.request("/leave/policies");
  }

  async getLeavePolicy(leaveType: string): Promise<LeavePolicy> {
    return this.request(`/leave/policies/${leaveType}`);
  }

  // Team leaves (for managers)
  async getTeamLeaves(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    leaves: LeaveRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/leave/team?${query.toString()}`);
  }

  // All leaves (for HR Admin/Manager)
  async getAllLeaves(params?: {
    status?: string;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    leaves: LeaveRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.leave_type) query.append("leave_type", params.leave_type);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/leave/all?${query.toString()}`);
  }

  // Reports
  async getLeaveReport(params: {
    start_date: string;
    end_date: string;
    employee_id?: string;
    leave_type?: string;
    department?: string;
  }): Promise<{
    summary: {
      total_leaves: number;
      by_type: Record<string, number>;
      by_status: Record<string, number>;
      average_duration: number;
    };
    records: LeaveRecord[];
  }> {
    const query = new URLSearchParams();
    query.append("start_date", params.start_date);
    query.append("end_date", params.end_date);
    if (params.employee_id) query.append("employee_id", params.employee_id);
    if (params.leave_type) query.append("leave_type", params.leave_type);
    if (params.department) query.append("department", params.department);

    return this.request(`/leave/reports/detailed?${query.toString()}`);
  }
}

// Hook for use in components
export const useLeaveAPI = () => {
  const { getAccessToken } = useAsgardeo();

  const getToken = async () => {
    const token = await getAccessToken();
    return token || "";
  };

  return new LeaveAPI(getToken);
};
