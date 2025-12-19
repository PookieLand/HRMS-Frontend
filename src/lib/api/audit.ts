// Audit Service API Client
import { useAsgardeo } from "@asgardeo/react";
import apiBase from "./apiBase";

const AUDIT_SERVICE_URL = apiBase("VITE_AUDIT_SERVICE_URL", "http://localhost:8004");

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AuditLogType =
  | "leave_request"
  | "leave_approval"
  | "attendance"
  | "payroll"
  | "employee_management"
  | "user_management"
  | "compliance"
  | "system";

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  log_type: AuditLogType;
  entity_type: string;
  entity_id: string;
  service_name: string;
  status: "success" | "failure" | "warning";
  description: string;
  timestamp: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  error_message?: string;
}

export interface AuditLogListResponse {
  total: number;
  items: AuditLog[];
  limit: number;
  offset: number;
}

export interface AuditLogFilters {
  offset?: number;
  limit?: number;
  user_id?: string;
  log_type?: AuditLogType;
  service_name?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// API Functions
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

/**
 * List audit logs with filtering and pagination
 */
export async function listAuditLogs(
  accessToken: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();

  if (filters.offset !== undefined)
    queryParams.append("offset", filters.offset.toString());
  if (filters.limit !== undefined)
    queryParams.append("limit", filters.limit.toString());
  if (filters.user_id) queryParams.append("user_id", filters.user_id);
  if (filters.log_type) queryParams.append("log_type", filters.log_type);
  if (filters.service_name)
    queryParams.append("service_name", filters.service_name);
  if (filters.entity_type)
    queryParams.append("entity_type", filters.entity_type);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const url = `${AUDIT_SERVICE_URL}/audit-logs?${queryParams.toString()}`;
  return fetchWithAuth<AuditLogListResponse>(url, accessToken);
}

/**
 * Get a single audit log by ID
 */
export async function getAuditLog(
  accessToken: string,
  auditId: number,
): Promise<AuditLog> {
  const url = `${AUDIT_SERVICE_URL}/audit-logs/${auditId}`;
  return fetchWithAuth<AuditLog>(url, accessToken);
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  accessToken: string,
  userId: string,
  filters: Omit<AuditLogFilters, "user_id"> = {},
): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();

  if (filters.offset !== undefined)
    queryParams.append("offset", filters.offset.toString());
  if (filters.limit !== undefined)
    queryParams.append("limit", filters.limit.toString());
  if (filters.log_type) queryParams.append("log_type", filters.log_type);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const url = `${AUDIT_SERVICE_URL}/audit-logs/user/${userId}?${queryParams.toString()}`;
  return fetchWithAuth<AuditLogListResponse>(url, accessToken);
}

/**
 * Get audit logs by type
 */
export async function getAuditLogsByType(
  accessToken: string,
  logType: AuditLogType,
  filters: Omit<AuditLogFilters, "log_type"> = {},
): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams();

  if (filters.offset !== undefined)
    queryParams.append("offset", filters.offset.toString());
  if (filters.limit !== undefined)
    queryParams.append("limit", filters.limit.toString());
  if (filters.service_name)
    queryParams.append("service_name", filters.service_name);
  if (filters.user_id) queryParams.append("user_id", filters.user_id);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const url = `${AUDIT_SERVICE_URL}/audit-logs/type/${logType}?${queryParams.toString()}`;
  return fetchWithAuth<AuditLogListResponse>(url, accessToken);
}

// ============================================================================
// React Hook
// ============================================================================

export const useAuditAPI = () => {
  const { getAccessToken } = useAsgardeo();

  const getToken = async () => {
    const token = await getAccessToken();
    return token || "";
  };

  return {
    listAuditLogs: async (filters?: AuditLogFilters) => {
      const token = await getToken();
      return listAuditLogs(token, filters);
    },
    getAuditLog: async (auditId: number) => {
      const token = await getToken();
      return getAuditLog(token, auditId);
    },
    getUserAuditLogs: async (
      userId: string,
      filters?: Omit<AuditLogFilters, "user_id">,
    ) => {
      const token = await getToken();
      return getUserAuditLogs(token, userId, filters);
    },
    getAuditLogsByType: async (
      logType: AuditLogType,
      filters?: Omit<AuditLogFilters, "log_type">,
    ) => {
      const token = await getToken();
      return getAuditLogsByType(token, logType, filters);
    },
  };
};

// Export service URL for debugging
export const auditServiceUrl = AUDIT_SERVICE_URL;
