export const HISTORY_LIMIT = 5000;

export type HistoryRange = '1h' | '24h' | '7d';

export function rangeToEpochMs(range: HistoryRange, now = Date.now()) {
  const duration = range === '1h' ? 60 * 60_000 : range === '24h' ? 24 * 60 * 60_000 : 7 * 24 * 60 * 60_000;
  return { from: now - duration, to: now };
}

export function sampleSeries(values: (number | null)[], limit = 40) {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (present.length <= limit) return present;
  const step = (present.length - 1) / (limit - 1);
  return Array.from({ length: limit }, (_, index) => present[Math.round(index * step)]!);
}
