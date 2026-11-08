import type { ConfigContext, ExpoConfig } from 'expo/config';

// IDs, API URLs and Maps client keys are build settings. Credentials/files stay outside Git.
export default ({ config }: ConfigContext): ExpoConfig => {
  const allowHttp = process.env.APP_ALLOW_HTTP === 'true';
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  const mapsKey = process.env.ANDROID_MAPS_API_KEY?.trim();
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();
  const plugins = (config.plugins ?? []).filter((plugin) => !['expo-build-properties', 'react-native-maps'].includes(typeof plugin === 'string' ? plugin : plugin[0] ?? ''));
  return {
    ...config,
    name: config.name ?? 'Smart Motorbike Guardian',
    slug: config.slug ?? 'smart-motorbike-guardian',
    plugins: [
      ...plugins,
      ['expo-build-properties', { android: { usesCleartextTraffic: allowHttp } }],
      ['react-native-maps', { ...(mapsKey ? { androidGoogleMapsApiKey: mapsKey } : {}) }],
    ],
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        ...(allowHttp ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true, NSAllowsLocalNetworking: true } } : {}),
      },
    },
  };
};
