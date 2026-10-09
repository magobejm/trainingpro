/* eslint-disable @typescript-eslint/no-require-imports */
const appJson = require('./app.json');

const LAN_BUILD = process.env.TRAINERPRO_LAN_BUILD === '1';

module.exports = () => {
  const expo = structuredClone(appJson.expo);
  if (!LAN_BUILD) {
    return { expo };
  }
  expo.updates = { ...expo.updates, enabled: false };
  expo.plugins = [...(expo.plugins ?? []), './plugins/with-lan-cleartext.js'];
  return { expo };
};
