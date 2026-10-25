/* eslint-disable @typescript-eslint/no-require-imports */
const { withMainActivity } = require('expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

/** Health Connect crashes unless the permission delegate is set before requesting access. */
function withHealthConnectDelegate(config) {
  return withMainActivity(config, (result) => {
    if (result.modResults.language !== 'kt') return result;
    let contents = result.modResults.contents;
    if (!contents.includes(IMPORT_LINE)) {
      contents = contents.replace(
        'import expo.modules.ReactActivityDelegateWrapper',
        `${IMPORT_LINE}\nimport expo.modules.ReactActivityDelegateWrapper`,
      );
    }
    if (!contents.includes(DELEGATE_CALL)) {
      contents = contents.replace('super.onCreate(null)', `super.onCreate(null)\n    ${DELEGATE_CALL}`);
    }
    result.modResults.contents = contents;
    return result;
  });
}

module.exports = withHealthConnectDelegate;
