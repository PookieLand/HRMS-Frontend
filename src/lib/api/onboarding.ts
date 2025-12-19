/**
 * Onboarding API Client
 *
 * Handles all onboarding-related API calls:
 * 1. HR initiates onboarding
 * 2. Employee views invitation preview
 * 3. Employee completes signup step 1 (user account)
 * 4. Employee completes signup step 2 (employee profile)
 * 5. Check onboarding status
 * 6. List pending invitations
 * 7. Cancel/resend invitations
 */

import { apiBase } from "./apiBase";

const API_BASE_URL = apiBase("VITE_USER_SERVICE_URL", "http://localhost:8000");

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
  | "cancelled"
  | "failed";

export interface InitiateOnboardingRequest {
  email: string;
  role: "HR_Manager" | "manager" | "employee";
  job_title: string;
  salary: number;
  salary_currency?: string;
  employment_type: EmploymentType;
  probation_months?: number | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  department?: string | null;
  team?: string | null;
  manager_id?: number | null;
  joining_date: string;
  notes?: string | null;
  frontend_origin?: string;
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

export interface OnboardingPreviewData {
  email: string;
  role: string;
  job_title: string;
  salary: number;
  salary_currency: string;
  employment_type: EmploymentType;
  probation_months: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  department: string | null;
  team: string | null;
  joining_date: string;
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
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  nationality?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
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
}

export interface OnboardingStatusResponse {
  invitation_token: string;
  email: string;
  role: string;
  job_title: string;
  status: OnboardingStatus;
  initiated_at: string;
  expires_at: string;
  is_expired: boolean;
  asgardeo_created_at: string | null;
  employee_created_at: string | null;
  completed_at: string | null;
  current_step: string;
  can_proceed: boolean;
}

export interface OnboardingInvitation {
  id: number;
  invitation_token: string;
  email: string;
  role: string;
  job_title: string;
  salary: number;
  salary_currency: string;
  employment_type: string;
  status: OnboardingStatus;
  initiated_by: number;
  initiated_at: string;
  expires_at: string;
  is_expired: boolean;
  days_until_expiry: number;
  asgardeo_id: string | null;
  user_id: number | null;
  employee_id: number | null;
}

export interface OnboardingListResponse {
  total: number;
  pending: number;
  completed: number;
  invitations: OnboardingInvitation[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Initiate employee onboarding (HR only)
 *
 * Called by HR Admin or HR Manager to start onboarding a new employee.
 * Requires authentication.
 *
 * Automatically includes the current frontend origin in the request,
 * so the backend can construct invitation links with the correct domain.
 */
export async function initiateOnboarding(
  data: InitiateOnboardingRequest,
  accessToken: string,
): Promise<InitiateOnboardingResponse> {
  // Get the current frontend origin dynamically
  const frontendOrigin = window.location.origin;

  const response = await fetch(`${API_BASE_URL}/onboarding/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ...data,
      frontend_origin: frontendOrigin,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to initiate onboarding" }));
    throw new Error(error.detail || "Failed to initiate onboarding");
  }

  return response.json();
}

/**
 * Get onboarding invitation preview
 *
 * Called when employee clicks invitation link to view pre-filled data.
 * No authentication required (uses invitation token).
 */
export async function getOnboardingPreview(
  invitationToken: string,
): Promise<OnboardingPreviewData> {
  const response = await fetch(
    `${API_BASE_URL}/onboarding/preview/${invitationToken}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Invalid invitation" }));
    throw new Error(error.detail || "Failed to load invitation");
  }

  return response.json();
}

/**
 * Complete signup step 1: Create user account
 *
 * Called by employee to create Asgardeo user and local user record.
 * No authentication required (uses invitation token).
 */
export async function completeSignupStep1(
  data: SignupStep1Request,
): Promise<SignupStep1Response> {
  const response = await fetch(`${API_BASE_URL}/onboarding/signup/step1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to create account" }));
    throw new Error(error.detail || "Failed to create account");
  }

  return response.json();
}

/**
 * Complete signup step 2: Create employee profile
 *
 * Called by employee to create employee record and complete onboarding.
 * No authentication required (uses invitation token).
 */
export async function completeSignupStep2(
  data: SignupStep2Request,
): Promise<SignupStep2Response> {
  const response = await fetch(`${API_BASE_URL}/onboarding/signup/step2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to complete profile" }));
    throw new Error(error.detail || "Failed to complete profile");
  }

  return response.json();
}

/**
 * Get onboarding status
 *
 * Check the current status of an onboarding invitation.
 * No authentication required (uses invitation token).
 */
export async function getOnboardingStatus(
  invitationToken: string,
): Promise<OnboardingStatusResponse> {
  const response = await fetch(
    `${API_BASE_URL}/onboarding/status/${invitationToken}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to get status" }));
    throw new Error(error.detail || "Failed to get onboarding status");
  }

  return response.json();
}

/**
 * List onboarding invitations (HR only)
 *
 * Get list of all onboarding invitations with filters.
 * Requires authentication.
 */
export async function listOnboardingInvitations(
  accessToken: string,
  params?: {
    status?: OnboardingStatus;
    offset?: number;
    limit?: number;
  },
): Promise<OnboardingListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.offset !== undefined)
    queryParams.append("offset", params.offset.toString());
  if (params?.limit !== undefined)
    queryParams.append("limit", params.limit.toString());

  const url = `${API_BASE_URL}/onboarding/invitations${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to list invitations" }));
    throw new Error(error.detail || "Failed to list onboarding invitations");
  }

  return response.json();
}

/**
 * Cancel onboarding invitation (HR only)
 *
 * Cancel a pending onboarding invitation.
 * Requires authentication.
 */
export async function cancelOnboarding(
  invitationToken: string,
  accessToken: string,
  reason?: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/onboarding/cancel/${invitationToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to cancel invitation" }));
    throw new Error(error.detail || "Failed to cancel onboarding");
  }

  return response.json();
}

/**
 * Resend onboarding invitation (HR only)
 *
 * Resend invitation email for a pending onboarding.
 * Requires authentication.
 */
export async function resendInvitation(
  invitationToken: string,
  accessToken: string,
): Promise<{ message: string; new_expires_at: string }> {
  const response = await fetch(
    `${API_BASE_URL}/onboarding/resend-invitation/${invitationToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to resend invitation" }));
    throw new Error(error.detail || "Failed to resend invitation");
  }

  return response.json();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format employment type for display
 */
export function formatEmploymentType(type: EmploymentType): string {
  return type === "permanent" ? "Permanent" : "Contract";
}

/**
 * Format onboarding status for display
 */
export function formatOnboardingStatus(status: OnboardingStatus): string {
  const statusMap: Record<OnboardingStatus, string> = {
    initiated: "Initiated",
    invitation_sent: "Invitation Sent",
    asgardeo_user_created: "Account Created",
    employee_created: "Profile Created",
    completed: "Completed",
    cancelled: "Cancelled",
    failed: "Failed",
  };
  return statusMap[status] || status;
}

/**
 * Get status badge color
 */
export function getStatusBadgeVariant(
  status: OnboardingStatus,
): "default" | "secondary" | "success" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
    case "failed":
      return "destructive";
    case "invitation_sent":
    case "asgardeo_user_created":
    case "employee_created":
      return "default";
    default:
      return "secondary";
  }
}

/**
 * Get current step description
 */
export function getCurrentStepDescription(status: OnboardingStatus): string {
  switch (status) {
    case "initiated":
      return "Preparing invitation email";
    case "invitation_sent":
      return "Waiting for employee to accept invitation";
    case "asgardeo_user_created":
      return "Account created, waiting for profile completion";
    case "employee_created":
      return "Profile created, finalizing onboarding";
    case "completed":
      return "Onboarding completed successfully";
    case "cancelled":
      return "Onboarding was cancelled";
    case "failed":
      return "Onboarding failed";
    default:
      return "Unknown status";
  }
}

/**
 * Check if invitation can be cancelled
 */
export function canCancelInvitation(status: OnboardingStatus): boolean {
  return ["initiated", "invitation_sent", "asgardeo_user_created"].includes(
    status,
  );
}

/**
 * Check if invitation can be resent
 */
export function canResendInvitation(status: OnboardingStatus): boolean {
  return ["initiated", "invitation_sent"].includes(status);
}

/**
 * Validate password strength on frontend
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  // Length
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (password.length >= 16) strength += 10;

  // Character variety
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) strength += 10;

  return Math.min(100, strength);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): {
  label: string;
  color: string;
} {
  if (strength < 40) {
    return { label: "Weak", color: "text-destructive" };
  } else if (strength < 70) {
    return { label: "Fair", color: "text-yellow-600" };
  } else if (strength < 90) {
    return { label: "Good", color: "text-blue-600" };
  } else {
    return { label: "Strong", color: "text-green-600" };
  }
}
