function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const apiBaseUrl = withoutTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:8080',
);

export const env = {
  apiBaseUrl,
  wsUrl:
    process.env.EXPO_PUBLIC_WS_URL?.trim() ||
    `${apiBaseUrl.replace(/^http/, 'ws')}/ws`,
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || undefined,
} as const;
