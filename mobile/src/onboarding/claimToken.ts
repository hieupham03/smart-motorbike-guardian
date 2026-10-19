export function extractClaimToken(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'object' && parsed && 'claimToken' in parsed) {
      const token = (parsed as { claimToken?: unknown }).claimToken;
      return typeof token === 'string' ? token.trim() : '';
    }
  } catch {
    // QR may contain the token directly.
  }
  try {
    const url = new URL(value);
    return url.searchParams.get('claimToken')?.trim() ?? value;
  } catch {
    return value;
  }
}
