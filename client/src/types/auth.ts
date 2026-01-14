export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
