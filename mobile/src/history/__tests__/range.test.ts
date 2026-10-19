import { HISTORY_LIMIT, rangeToEpochMs, sampleSeries } from '../range';

describe('history utilities', () => {
  it('builds a 24 hour epoch millisecond range', () => {
    expect(rangeToEpochMs('24h', 100_000_000)).toEqual({ from: 13_600_000, to: 100_000_000 });
    expect(HISTORY_LIMIT).toBe(5000);
  });

  it('keeps endpoints while limiting chart samples', () => {
    const result = sampleSeries(Array.from({ length: 100 }, (_, index) => index), 10);
    expect(result).toHaveLength(10);
    expect(result[0]).toBe(0);
    expect(result[9]).toBe(99);
  });

  it('removes null and non-finite chart values', () => {
    expect(sampleSeries([null, 1, Number.NaN, 2])).toEqual([1, 2]);
  });
});
