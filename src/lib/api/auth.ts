// API Base URL - you can configure this via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface SignupResponse {
  user_id: number;
  email: string;
  asgardeo_id: string;
  status: string;
}

export interface ErrorResponse {
  detail: string;
}

/**
 * Sign up a new user
 * @param data - Signup request data
 * @returns Promise with signup response
 * @throws Error with message from API
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        detail: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(errorData.detail || 'Signup failed');
    }

    const result: SignupResponse = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during signup');
  }
}
