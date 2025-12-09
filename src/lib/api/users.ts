// User Management API Client
// Handles all API calls for user management including onboarding, profile, and user operations

const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8000";

// ============================================================================
// Types
// ============================================================================

export type EmploymentType = "permanent" | "contract";
export type OnboardingStatus =
  | "initiated"
  | "invitation_sent"
  | "asgardeo_user_created"
  | "employee_created"
  | "completed"
  | "failed"
  | "cancelled";
export type UserStatus = "active" | "suspended" | "deleted";
export type UserRole = "HR_Admin" | "HR_Manager" | "manager" | "employee";

export interface User {
  id: number;
  asgardeo_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  employee_id?: number;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  total: number;
  users: User[];
}

export interface UserProfile extends User {
  department?: string;
  job_title?: string;
  team?: string;
  manager_id?: number;
  joining_date?: string;
}

// Onboarding Types
export interface InitiateOnboardingRequest {
  email: string;
  role: "HR_Manager" | "manager" | "employee";
  job_title: string;
  salary: number;
  salary_currency?: string;
  employment_type: EmploymentType;
  probation_months?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  department?: string;
  team?: string;
  manager_id?: number;
  joining_date: string;
  notes?: string;
}

export interface InitiateOnboardingResponse {
  message: string;
  invitation_token: string;
  email: string;
  role: string;
  job_title: string;
  invitation_link: string;
  expires_at: string;
}

export interface OnboardingPreview {
  email: string;
  role: string;
  job_title: string;
  salary: number;
  salary_currency: string;
  employment_type: EmploymentType;
  probation_months?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  department?: string;
  team?: string;
  joining_date: string;
  company_name: string;
  is_valid: boolean;
  is_expired: boolean;
}

export interface SignupStep1Request {
  invitation_token: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface SignupStep1Response {
  message: string;
  email: string;
  asgardeo_id: string;
  user_id: number;
  next_step: string;
}

export interface SignupStep2Request {
  invitation_token: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  nationality?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
}

export interface SignupStep2Response {
  message: string;
  user_id: number;
  employee_id: number;
  email: string;
  role: string;
  job_title: string;
  employment_type: string;
  joining_date: string;
  check_email_for_password: boolean;
}

export interface OnboardingStatusResponse {
  invitation_token: string;
  email: string;
  status: OnboardingStatus;
  role: string;
  job_title: string;
  employment_type: EmploymentType;
  joining_date: string;
  initiated_by_name?: string;
  initiated_at: string;
  asgardeo_user_created: boolean;
  employee_created: boolean;
  completed_at?: string;
  is_expired: boolean;
}

export interface OnboardingListResponse {
  total: number;
  invitations: OnboardingStatusResponse[];
}

// User Operations Types
export interface UpdateUserRoleRequest {
  new_role: UserRole;
  reason?: string;
}

export interface SuspendUserRequest {
  reason: string;
}

export interface DeleteUserRequest {
  reason?: string;
  soft_delete?: boolean;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface UserPermissions {
  can_view_users: boolean;
  can_create_users: boolean;
  can_update_users: boolean;
  can_delete_users: boolean;
  can_suspend_users: boolean;
  can_change_roles: boolean;
  can_view_salary: boolean;
  can_approve_leaves: boolean;
  can_view_audit_logs: boolean;
  viewable_roles: UserRole[];
  manageable_roles: UserRole[];
}

export interface RoleInfo {
  name: string;
  display_name: string;
  description: string;
  level: number;
}

// ============================================================================
// API Helper
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
    const errorData = await response.json().catch(() => ({
      detail: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(
      errorData.detail || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

async function fetchPublic<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(
      errorData.detail || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

// ============================================================================
// Onboarding API
// ============================================================================

/**
 * Initiate employee onboarding (HR Admin/HR Manager only)
 */
export async function initiateOnboarding(
  accessToken: string,
  data: InitiateOnboardingRequest,
): Promise<InitiateOnboardingResponse> {
  return fetchWithAuth<InitiateOnboardingResponse>(
    `${USER_SERVICE_URL}/api/v1/onboarding/initiate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Get onboarding preview data (public - accessed via invitation link)
 */
export async function getOnboardingPreview(
  invitationToken: string,
): Promise<OnboardingPreview> {
  return fetchPublic<OnboardingPreview>(
    `${USER_SERVICE_URL}/api/v1/onboarding/preview/${invitationToken}`,
  );
}

/**
 * Complete signup step 1 - Create user account (public)
 */
export async function signupStep1(
  data: SignupStep1Request,
): Promise<SignupStep1Response> {
  return fetchPublic<SignupStep1Response>(
    `${USER_SERVICE_URL}/api/v1/onboarding/signup/step1`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Complete signup step 2 - Create employee record (public)
 */
export async function signupStep2(
  data: SignupStep2Request,
): Promise<SignupStep2Response> {
  return fetchPublic<SignupStep2Response>(
    `${USER_SERVICE_URL}/api/v1/onboarding/signup/step2`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Get onboarding status (HR Admin/HR Manager only)
 */
export async function getOnboardingStatus(
  accessToken: string,
  invitationToken: string,
): Promise<OnboardingStatusResponse> {
  return fetchWithAuth<OnboardingStatusResponse>(
    `${USER_SERVICE_URL}/api/v1/onboarding/status/${invitationToken}`,
    accessToken,
  );
}

/**
 * List onboarding invitations (HR Admin/HR Manager only)
 */
export async function listOnboardingInvitations(
  accessToken: string,
  params?: {
    status?: OnboardingStatus;
    limit?: number;
    offset?: number;
  },
): Promise<OnboardingListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${USER_SERVICE_URL}/api/v1/onboarding/list${queryString ? `?${queryString}` : ""}`;

  return fetchWithAuth<OnboardingListResponse>(url, accessToken);
}

/**
 * Cancel onboarding invitation (HR Admin/HR Manager only)
 */
export async function cancelOnboarding(
  accessToken: string,
  invitationToken: string,
  reason?: string,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/onboarding/cancel/${invitationToken}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

/**
 * Resend invitation email (HR Admin/HR Manager only)
 */
export async function resendInvitation(
  accessToken: string,
  invitationToken: string,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/onboarding/resend/${invitationToken}`,
    accessToken,
    {
      method: "POST",
    },
  );
}

// ============================================================================
// User Management API
// ============================================================================

/**
 * List all users with optional filters
 */
export async function listUsers(
  accessToken: string,
  params?: {
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
    offset?: number;
  },
): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.append("role", params.role);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${USER_SERVICE_URL}/api/v1/users${queryString ? `?${queryString}` : ""}`;

  return fetchWithAuth<UserListResponse>(url, accessToken);
}

/**
 * Get user profile by ID
 */
export async function getUser(
  accessToken: string,
  userId: number,
): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>(
    `${USER_SERVICE_URL}/api/v1/users/${userId}`,
    accessToken,
  );
}

/**
 * Get current user's profile
 */
export async function getCurrentUser(
  accessToken: string,
): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>(
    `${USER_SERVICE_URL}/api/v1/users/me`,
    accessToken,
  );
}

/**
 * Update user role
 */
export async function updateUserRole(
  accessToken: string,
  userId: number,
  data: UpdateUserRoleRequest,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/users/${userId}/role`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Suspend user
 */
export async function suspendUser(
  accessToken: string,
  userId: number,
  data: SuspendUserRequest,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/users/${userId}/suspend`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Activate (unsuspend) user
 */
export async function activateUser(
  accessToken: string,
  userId: number,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/users/${userId}/activate`,
    accessToken,
    {
      method: "POST",
    },
  );
}

/**
 * Delete user
 */
export async function deleteUser(
  accessToken: string,
  userId: number,
  data?: DeleteUserRequest,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/users/${userId}`,
    accessToken,
    {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    },
  );
}

/**
 * List available roles
 */
export async function listRoles(accessToken: string): Promise<RoleInfo[]> {
  return fetchWithAuth<RoleInfo[]>(
    `${USER_SERVICE_URL}/api/v1/users/roles`,
    accessToken,
  );
}

/**
 * Get user permissions for current user
 */
export async function getUserPermissions(
  accessToken: string,
): Promise<UserPermissions> {
  return fetchWithAuth<UserPermissions>(
    `${USER_SERVICE_URL}/api/v1/users/permissions`,
    accessToken,
  );
}

/**
 * Sync users from Asgardeo (Admin only)
 */
export async function syncUsersFromAsgardeo(
  accessToken: string,
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    `${USER_SERVICE_URL}/api/v1/users/sync`,
    accessToken,
    {
      method: "POST",
    },
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format user role for display
 */
export function formatRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    HR_Admin: "HR Administrator",
    HR_Manager: "HR Manager",
    manager: "Manager",
    employee: "Employee",
  };
  return roleLabels[role] || role;
}

/**
 * Format user status for display
 */
export function formatStatus(status: UserStatus): string {
  const statusLabels: Record<UserStatus, string> = {
    active: "Active",
    suspended: "Suspended",
    deleted: "Deleted",
  };
  return statusLabels[status] || status;
}

/**
 * Format onboarding status for display
 */
export function formatOnboardingStatus(status: OnboardingStatus): string {
  const statusLabels: Record<OnboardingStatus, string> = {
    initiated: "Initiated",
    invitation_sent: "Invitation Sent",
    asgardeo_user_created: "Account Created",
    employee_created: "Employee Created",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return statusLabels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: UserStatus | OnboardingStatus): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    suspended: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    deleted: "bg-red-500/10 text-red-500 border-red-500/20",
    initiated: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    invitation_sent: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    asgardeo_user_created:
      "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    employee_created: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
}

/**
 * Check if user can manage another user based on roles
 */
export function canManageUser(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  // HR_Admin can manage anyone
  if (actorRole === "HR_Admin") return true;

  // HR_Manager can manage manager and employee, but not other HR_Managers
  if (actorRole === "HR_Manager") {
    return targetRole !== "HR_Admin" && targetRole !== "HR_Manager";
  }

  // Manager and employee cannot manage users
  return false;
}

/**
 * Check if role can initiate onboarding
 */
export function canInitiateOnboarding(role: UserRole): boolean {
  return role === "HR_Admin" || role === "HR_Manager";
}

/**
 * Get available target roles for onboarding based on actor role
 */
export function getOnboardableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "HR_Admin") {
    return ["HR_Manager", "manager", "employee"];
  }
  if (actorRole === "HR_Manager") {
    return ["manager", "employee"];
  }
  return [];
}

// Export service URL for debugging
export const userServiceUrl = USER_SERVICE_URL;
