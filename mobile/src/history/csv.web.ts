import { apiClient } from '@/api/client';

export async function exportTelemetryCsv(deviceId: string, from: number, to: number) {
  const response = await apiClient.raw.get<Blob>(`/api/devices/${deviceId}/telemetry/export`, {
    params: { from, to }, responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `telemetry_${deviceId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
