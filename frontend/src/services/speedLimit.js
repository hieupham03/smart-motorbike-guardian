export function parseSpeedLimit(text) {
  const value = String(text).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 120 ? number : null;
}
