/* eslint-disable @typescript-eslint/no-require-imports */
const { withAndroidManifest } = require('expo/config-plugins');

/** Allows the LAN preview APK to call the local HTTP API and Supabase. */
function withLanCleartext(config) {
  return withAndroidManifest(config, enableCleartext);
}

function enableCleartext(config) {
  const application = config.modResults.manifest.application?.[0];
  if (application) {
    application.$['android:usesCleartextTraffic'] = 'true';
  }
  return config;
}

module.exports = withLanCleartext;
