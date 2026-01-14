import type { AuthResponse, ChangePasswordRequest, LoginCredentials, User } from '../types/auth';

const API_BASE = '/api';

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include', // Include cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * Refresh access token using httpOnly cookie
 */
export async function refreshAccessToken(): Promise<AuthResponse | null> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

/**
 * Get current user
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get user');
  }

  const data = await response.json();
  return data.user;
}

/**
 * Change password
 */
export async function changePassword(
  accessToken: string,
  request: ChangePasswordRequest
): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }
}

/**
 * Check if setup is required (no admin exists)
 */
export async function checkSetupRequired(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/auth/setup-required`);
  
  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.setupRequired;
}
