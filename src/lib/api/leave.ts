import { useAsgardeo } from "@asgardeo/react";

const LEAVE_SERVICE_URL =
  import.meta.env.VITE_LEAVE_SERVICE_URL || "http://localhost:8003/api/v1";

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

  // Leave application (Self-Service)
  async applyLeave(
    data: Omit<LeaveRequest, "employee_id">,
  ): Promise<LeaveRecord> {
    return this.request<LeaveRecord>("/leaves/me", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelLeave(
    leaveId: string,
    reason?: string,
  ): Promise<{ ok: boolean; message: string }> {
    return this.request(`/leaves/me/${leaveId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Get leave records (Self-Service)
  async getMyLeaves(params?: {
    status?: string;
    leave_type?: string;
    offset?: number;
    limit?: number;
  }): Promise<LeaveRecord[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.leave_type) query.append("leave_type", params.leave_type);
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request(`/leaves/me?${query.toString()}`);
  }

  async getLeaveById(leaveId: string): Promise<LeaveRecord> {
    return this.request(`/leaves/${leaveId}`);
  }

  async getEmployeeLeaves(
    employeeId: string,
    params?: {
      status?: string;
      leave_type?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<LeaveRecord[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.leave_type) query.append("leave_type", params.leave_type);
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request(`/leaves/employee/${employeeId}?${query.toString()}`);
  }

  // Leave approval (for managers/HR)
  async getPendingApprovals(params?: {
    offset?: number;
    limit?: number;
  }): Promise<LeaveRecord[]> {
    const query = new URLSearchParams();
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request(`/leaves/pending?${query.toString()}`);
  }

  async approveLeave(leaveId: string, notes?: string): Promise<LeaveRecord> {
    return this.request(`/leaves/${leaveId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approval_notes: notes }),
    });
  }

  async rejectLeave(leaveId: string, reason: string): Promise<LeaveRecord> {
    return this.request(`/leaves/${leaveId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  // Dashboard summary (for HR)
  async getDashboardSummary(): Promise<{
    total_leaves: number;
    pending_leaves: number;
    approved_leaves: number;
    rejected_leaves: number;
    cancelled_leaves: number;
  }> {
    return this.request(`/leaves/dashboard/summary`);
  }

  // All leaves (for HR Admin/Manager)
  async getAllLeaves(params?: {
    status?: string;
    leave_type?: string;
    offset?: number;
    limit?: number;
  }): Promise<LeaveRecord[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.leave_type) query.append("leave_type", params.leave_type);
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request(`/leaves?${query.toString()}`);
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
