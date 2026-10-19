import type { Device } from '@/types/api';

export type GpsPresentation =
  | { state: 'NO_FIX'; coordinate: null }
  | { state: 'FIX' | 'STALE'; coordinate: { latitude: number; longitude: number } };

function validCoordinate(latitude: number | null, longitude: number | null) {
  return (
    latitude != null && longitude != null &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  );
}

export function getGpsPresentation(device: Device | null): GpsPresentation {
  if (!device || !validCoordinate(device.lastLatitude, device.lastLongitude)) {
    return { state: 'NO_FIX', coordinate: null };
  }
  return {
    state: device.gpsValid ? 'FIX' : 'STALE',
    coordinate: { latitude: device.lastLatitude!, longitude: device.lastLongitude! },
  };
}
