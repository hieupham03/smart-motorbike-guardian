import { apiClient, type GuardianApiClient } from './client';
import type {
  ApiResponse,
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/api';

export function createAuthApi(client: GuardianApiClient = apiClient) {
  return {
    login: async (payload: LoginRequest) => {
      const response = await client.raw.post<ApiResponse<AuthResponse>>('/api/auth/login', payload);
      return response.data;
    },
    register: async (payload: RegisterRequest) => {
      const response = await client.raw.post<ApiResponse<AuthResponse>>('/api/auth/register', payload);
      return response.data;
    },
    me: () => client.request<User>({ url: '/api/users/me', method: 'GET' }),
    changePassword: (payload: ChangePasswordRequest) =>
      client.request<null>({ url: '/api/auth/change-password', method: 'POST', data: payload }),
  };
}

export const authApi = createAuthApi();
