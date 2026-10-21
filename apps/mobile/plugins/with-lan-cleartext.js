/* eslint-disable @typescript-eslint/no-require-imports */
const { withAndroidManifest } = require('expo/config-plugins');

/** Allows the LAN preview APK to call the local HTTP API and Supabase. */
function withLanCleartext(config, { enabled = false } = {}) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:usesCleartextTraffic'] = String(enabled);
    }
    return result;
  });
}

module.exports = withLanCleartext;
