export type AccountRole = 'OWNER' | 'VIEWER' | 'ADMIN';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: AccountRole;
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  /** Backend configuration value in milliseconds. */
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  role: Exclude<AccountRole, 'ADMIN'>;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
