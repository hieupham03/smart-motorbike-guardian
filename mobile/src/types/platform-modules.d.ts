declare module '@/map/LiveMap' {
  export function LiveMap(props: {
    latitude: number;
    longitude: number;
    stale: boolean;
  }): React.JSX.Element;
}
