/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

const LAN_BUILD = process.env.TRAINERPRO_LAN_BUILD === '1';

module.exports = () => {
  const expo = structuredClone(appJson.expo);
  applyGoogleServices(expo);
  if (!LAN_BUILD) {
    return { expo };
  }
  expo.updates = { ...expo.updates, enabled: false };
  expo.plugins = [...(expo.plugins ?? []), './plugins/with-lan-cleartext.js'];
  return { expo };
};

function applyGoogleServices(expo) {
  const file = path.join(__dirname, 'google-services.json');
  if (!fs.existsSync(file)) {
    return;
  }
  expo.android = { ...(expo.android ?? {}), googleServicesFile: './google-services.json' };
}
