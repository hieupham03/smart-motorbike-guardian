declare module '@/map/LiveMap' {
  export function LiveMap(props: {
    latitude: number;
    longitude: number;
    stale: boolean;
  }): React.JSX.Element;
}

declare module '@/history/csv' {
  export function exportTelemetryCsv(deviceId: string, from: number, to: number): Promise<void>;
}
