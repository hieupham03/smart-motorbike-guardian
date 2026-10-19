import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { apiClient } from '@/api/client';

export async function exportTelemetryCsv(deviceId: string, from: number, to: number) {
  const response = await apiClient.raw.get<ArrayBuffer>(`/api/devices/${deviceId}/telemetry/export`, {
    params: { from, to }, responseType: 'arraybuffer',
  });
  const safeId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const file = new File(Paths.cache, `telemetry_${safeId}_${Date.now()}.csv`);
  await file.create({ overwrite: true });
  await file.write(new Uint8Array(response.data));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị không hỗ trợ bảng chia sẻ tệp.');
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Chia sẻ lịch sử telemetry' });
}
