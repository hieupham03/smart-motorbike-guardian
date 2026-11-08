// Evaluate Expo build config without generating native projects or accessing EAS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const { getConfig } = require(path.join(root, 'frontend/mobile/node_modules/expo/config'));
process.env.ANDROID_MAPS_API_KEY = 'local-config-check-only';
process.env.EXPO_PUBLIC_EAS_PROJECT_ID = '11111111-1111-4111-8111-111111111111';
delete process.env.GOOGLE_SERVICES_JSON;
const plugin = (config, name) => config.plugins.find(p => Array.isArray(p) && p[0] === name)?.[1];
process.env.APP_ALLOW_HTTP = 'true';
const development = getConfig(path.join(root, 'frontend/mobile')).exp;
assert.equal(plugin(development, 'expo-build-properties').android.usesCleartextTraffic, true);
assert.equal(development.ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking, true);
assert.equal(plugin(development, 'react-native-maps').androidGoogleMapsApiKey, 'local-config-check-only');
assert.equal(development.extra.eas.projectId, process.env.EXPO_PUBLIC_EAS_PROJECT_ID);
process.env.APP_ALLOW_HTTP = 'false';
const production = getConfig(path.join(root, 'frontend/mobile')).exp;
assert.equal(plugin(production, 'expo-build-properties').android.usesCleartextTraffic, false);
assert.equal(production.ios.infoPlist?.NSAppTransportSecurity, undefined);
// Apply plugins in memory: validates generated manifest values without creating android/ios directories.
for (const allowHttp of ['true', 'false']) {
  const inspected = spawnSync(process.execPath, [path.join(root, 'frontend/mobile/node_modules/expo/bin/cli'), 'config', '--type', 'introspect', '--json'], {
    cwd: path.join(root, 'frontend/mobile'), encoding: 'utf8', windowsHide: true, timeout: 60_000,
    env: { ...process.env, APP_ALLOW_HTTP: allowHttp, EXPO_NO_DOTENV: '1', CI: '1' },
  });
  assert.equal(inspected.status, 0, inspected.stderr);
  const manifest = JSON.parse(inspected.stdout)._internal.modResults.android.manifest.manifest;
  const app = manifest.application[0];
  assert.equal(String(app.$['android:usesCleartextTraffic']), allowHttp);
  const maps = app['meta-data'].find(item => item.$['android:name'] === 'com.google.android.geo.API_KEY');
  assert.equal(maps.$['android:value'], 'local-config-check-only');
}
const result = {
  result: 'PASS', source: 'EXPO_CONFIG_AND_PLUGIN_INTROSPECTION_ONLY',
  developmentAllowsLanHttp: true, productionCleartextDisabled: true,
  mapsPluginReceivesConfiguredKey: true, easProjectIdWired: true,
  androidManifestFlagsAndMapsKeyVerified: true,
  nativeBuildPerformed: false,
};
const output = path.join(root, 'docs/evidence/mobile/2026-10-25-integrated/native-config-check.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
