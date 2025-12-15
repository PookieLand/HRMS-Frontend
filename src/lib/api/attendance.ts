import { useAsgardeo } from "@asgardeo/react";

const ATTENDANCE_SERVICE_URL =
  import.meta.env.VITE_ATTENDANCE_SERVICE_URL || "http://localhost:8003/api/v1";

export interface CheckInRequest {
  employee_id: string;
  location?: string;
  notes?: string;
}

export interface CheckOutRequest {
  employee_id: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  date: string;
  duration_hours?: number;
  status:
    | "present"
    | "late"
    | "absent"
    | "on_leave"
    | "short_leave"
    | "overtime";
  location?: string;
  notes?: string;
  overtime_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  employee_id: string;
  period: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  total_hours_worked: number;
  average_hours_per_day: number;
  overtime_hours: number;
  short_leave_count: number;
  attendance_percentage: number;
}

export interface DailyAttendanceMetrics {
  date: string;
  total_employees: number;
  checked_in: number;
  not_checked_in: number;
  on_leave: number;
  late_arrivals: number;
  attendance_rate: number;
}

export interface WeeklyAttendanceReport {
  employee_id: string;
  week_start: string;
  week_end: string;
  days: Array<{
    date: string;
    day_name: string;
    check_in?: string;
    check_out?: string;
    hours_worked?: number;
    status: string;
  }>;
  total_hours: number;
  total_days_present: number;
  overtime_hours: number;
}

export interface MonthlyAttendanceReport {
  employee_id: string;
  month: string;
  year: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  days_on_leave: number;
  total_hours_worked: number;
  overtime_hours: number;
  attendance_percentage: number;
  records: AttendanceRecord[];
}

export interface AttendanceDashboardMetrics {
  today: DailyAttendanceMetrics;
  week_summary: {
    total_hours: number;
    average_attendance_rate: number;
    late_arrivals: number;
    overtime_total: number;
  };
  month_summary: {
    attendance_rate: number;
    total_hours: number;
    average_hours_per_day: number;
  };
}

export class AttendanceAPI {
  private baseUrl: string;
  private getToken: () => Promise<string>;

  constructor(getToken: () => Promise<string>) {
    this.baseUrl = ATTENDANCE_SERVICE_URL;
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

  // Check-in/Check-out (for self)
  async checkIn(data: {
    location?: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-in-self", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkOut(data: { notes?: string }): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-out-self", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Admin/Manager check-in/check-out for others
  async checkInEmployee(data: CheckInRequest): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkOutEmployee(data: CheckOutRequest): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get attendance records
  async getMyAttendanceToday(): Promise<AttendanceRecord | null> {
    try {
      return await this.request<AttendanceRecord>("/attendance/me/today");
    } catch (error) {
      return null;
    }
  }

  async getMyAttendance(params?: {
    start_date?: string;
    end_date?: string;
    offset?: number;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request<AttendanceRecord[]>(
      `/attendance/me/history?${query.toString()}`,
    );
  }

  async getEmployeeAttendance(
    employeeId: number,
    params?: {
      start_date?: string;
      end_date?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.offset !== undefined)
      query.append("offset", params.offset.toString());
    if (params?.limit !== undefined)
      query.append("limit", params.limit.toString());

    return this.request<AttendanceRecord[]>(
      `/attendance/employee/${employeeId}?${query.toString()}`,
    );
  }

  // Summary and Reports
  async getMonthlySummary(
    employeeId: number,
    month?: number,
    year?: number,
  ): Promise<{
    employee_id: number;
    month: number;
    year: number;
    total_days_present: number;
    total_days_late: number;
    total_days_absent: number;
    total_hours_worked: number;
    average_hours_per_day: number;
    overtime_hours: number;
    attendance_percentage: number;
    records: AttendanceRecord[];
  }> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());

    return this.request(
      `/attendance/employee/${employeeId}/monthly-summary?${query.toString()}`,
    );
  }

  // Dashboard metrics (for managers/HR)
  async getDashboardMetrics(date?: string): Promise<{
    date: string;
    total_employees: number;
    checked_in: number;
    not_checked_in: number;
    present: number;
    absent: number;
    late: number;
    pending: number;
    records: AttendanceRecord[];
  }> {
    const query = date ? `?date=${date}` : "";
    return this.request(`/attendance/dashboard${query}`);
  }

  async getDailyMetrics(date: string): Promise<DailyAttendanceMetrics> {
    const dashboard = await this.getDashboardMetrics(date);
    return {
      date: dashboard.date,
      total_employees: dashboard.total_employees,
      checked_in: dashboard.checked_in,
      not_checked_in: dashboard.not_checked_in,
      on_leave: 0, // Not provided by backend, would need leave service integration
      late_arrivals: dashboard.late,
      attendance_rate: (dashboard.checked_in / dashboard.total_employees) * 100,
    };
  }

  // Team attendance (for managers)
  async getTeamAttendance(params?: {
    date?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ records: AttendanceRecord[]; total: number }> {
    // Use dashboard endpoint and filter results
    const date = params?.date || new Date().toISOString().split("T")[0];
    const dashboard = await this.getDashboardMetrics(date);

    let records = dashboard.records;

    // Apply status filter if provided
    if (params?.status && params.status !== "all") {
      records = records.filter((r) => r.status === params.status);
    }

    // Apply pagination
    const page = params?.page || 1;
    const pageSize = params?.page_size || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedRecords = records.slice(start, end);

    return {
      records: paginatedRecords,
      total: records.length,
    };
  }

  // Get specific attendance record
  async getAttendanceRecord(attendanceId: number): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>(`/attendance/${attendanceId}`);
  }
}

// Hook for use in components
export const useAttendanceAPI = () => {
  const { getAccessToken } = useAsgardeo();

  const getToken = async () => {
    const token = await getAccessToken();
    return token || "";
  };

  return new AttendanceAPI(getToken);
};
