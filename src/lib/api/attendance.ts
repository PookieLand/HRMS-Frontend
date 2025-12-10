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

  // Check-in/Check-out
  async checkIn(data: CheckInRequest): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkOut(data: CheckOutRequest): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get attendance records
  async getMyAttendance(params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/attendance/my-attendance?${query.toString()}`);
  }

  async getEmployeeAttendance(
    employeeId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(
      `/attendance/employee/${employeeId}?${query.toString()}`,
    );
  }

  async getTodayAttendance(
    employeeId: string,
  ): Promise<AttendanceRecord | null> {
    return this.request(`/attendance/employee/${employeeId}/today`);
  }

  // Summary and Reports
  async getMySummary(
    period: "week" | "month" | "year" = "month",
  ): Promise<AttendanceSummary> {
    return this.request(`/attendance/my-summary?period=${period}`);
  }

  async getEmployeeSummary(
    employeeId: string,
    period: "week" | "month" | "year" = "month",
  ): Promise<AttendanceSummary> {
    return this.request(
      `/attendance/employee/${employeeId}/summary?period=${period}`,
    );
  }

  async getWeeklyReport(employeeId?: string): Promise<WeeklyAttendanceReport> {
    const endpoint = employeeId
      ? `/attendance/reports/weekly/${employeeId}`
      : "/attendance/reports/my-weekly";
    return this.request(endpoint);
  }

  async getMonthlyReport(
    employeeId?: string,
    month?: number,
    year?: number,
  ): Promise<MonthlyAttendanceReport> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());

    const endpoint = employeeId
      ? `/attendance/reports/monthly/${employeeId}?${query.toString()}`
      : `/attendance/reports/my-monthly?${query.toString()}`;
    return this.request(endpoint);
  }

  // Dashboard metrics (for managers/HR)
  async getDailyMetrics(date?: string): Promise<DailyAttendanceMetrics> {
    const query = date ? `?date=${date}` : "";
    return this.request(`/attendance/metrics/daily${query}`);
  }

  async getDashboardMetrics(): Promise<AttendanceDashboardMetrics> {
    return this.request("/attendance/metrics/dashboard");
  }

  // Team attendance (for managers)
  async getTeamAttendance(params?: {
    date?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ records: AttendanceRecord[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/attendance/team?${query.toString()}`);
  }

  // All attendance (for HR Admin/Manager)
  async getAllAttendance(params?: {
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    records: AttendanceRecord[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
      query.append("page_size", params.page_size.toString());

    return this.request(`/attendance/all?${query.toString()}`);
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
