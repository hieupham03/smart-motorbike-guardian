import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/types/api';

export class GuardianApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly kind: 'network' | 'timeout' | 'http' | 'invalid-response' = 'http',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'GuardianApiError';
  }
}

export function normalizeApiError(error: unknown) {
  if (error instanceof GuardianApiError) return error;
  if (!isAxiosError(error)) {
    return new GuardianApiError('Đã xảy ra lỗi không xác định', undefined, 'invalid-response');
  }
  if (error.code === 'ECONNABORTED') {
    return new GuardianApiError('Máy chủ phản hồi quá chậm', undefined, 'timeout');
  }
  if (!error.response) {
    return new GuardianApiError('Không thể kết nối tới máy chủ', undefined, 'network');
  }
  const body = error.response.data as Partial<ApiResponse<unknown>> | undefined;
  return new GuardianApiError(
    body?.message || `Yêu cầu thất bại (${error.response.status})`,
    error.response.status,
    'http',
    body?.data,
  );
}
