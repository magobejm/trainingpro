/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

const LAN_BUILD = process.env.TRAINERPRO_LAN_BUILD === '1';

module.exports = () => {
  const expo = structuredClone(appJson.expo);
  applyGoogleServices(expo);
  expo.plugins = [
    ...(expo.plugins ?? []).filter((plugin) => plugin !== 'expo-video'),
    'expo-video',
    ['./plugins/with-lan-cleartext.js', { enabled: LAN_BUILD }],
    './plugins/with-health-connect-delegate.js',
  ];
  expo.updates = { ...expo.updates, enabled: LAN_BUILD ? false : (expo.updates?.enabled ?? true) };
  if (!LAN_BUILD) {
    return { expo };
  }
  return { expo };
};

function applyGoogleServices(expo) {
  const file = path.join(__dirname, 'google-services.json');
  if (!fs.existsSync(file)) {
    return;
  }
  expo.android = { ...(expo.android ?? {}), googleServicesFile: './google-services.json' };
}
