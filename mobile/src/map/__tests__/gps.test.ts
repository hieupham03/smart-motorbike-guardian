import { getGpsPresentation } from '../gps';
import type { Device } from '@/types/api';

const base = { lastLatitude: null, lastLongitude: null, gpsValid: false } as Device;

describe('GPS presentation', () => {
  it('does not create a marker before the first valid fix', () => {
    expect(getGpsPresentation(base)).toEqual({ state: 'NO_FIX', coordinate: null });
  });

  it('accepts zero coordinates as valid', () => {
    expect(getGpsPresentation({ ...base, lastLatitude: 0, lastLongitude: 0, gpsValid: true })).toEqual({
      state: 'FIX', coordinate: { latitude: 0, longitude: 0 },
    });
  });

  it('keeps the last valid location but labels it stale', () => {
    expect(getGpsPresentation({ ...base, lastLatitude: 10.1, lastLongitude: 106.2 })).toEqual({
      state: 'STALE', coordinate: { latitude: 10.1, longitude: 106.2 },
    });
  });

  it('rejects coordinates outside geographic bounds', () => {
    expect(getGpsPresentation({ ...base, lastLatitude: 91, lastLongitude: 106 })).toEqual({ state: 'NO_FIX', coordinate: null });
  });
});
