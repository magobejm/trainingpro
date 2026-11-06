/* eslint-disable @typescript-eslint/no-require-imports */
const { withAndroidManifest, withMainActivity } = require('expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';
const USAGE_ALIAS = 'ViewPermissionUsageActivity';

/** Health Connect crashes unless the permission delegate is set before requesting access. */
function withHealthConnectDelegate(config) {
  return withPermissionUsageAlias(
    withMainActivity(config, (result) => {
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
    }),
  );
}

/** Android 14+ refuses health grants unless the app exposes this privacy-policy alias. */
function withPermissionUsageAlias(config) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application?.[0];
    if (!application) return result;
    const aliases = application['activity-alias'] ?? [];
    const present = aliases.some((alias) => alias.$?.['android:name'] === USAGE_ALIAS);
    if (!present) {
      aliases.push({
        $: {
          'android:exported': 'true',
          'android:name': USAGE_ALIAS,
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
          'android:targetActivity': '.MainActivity',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
            category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
          },
        ],
      });
      application['activity-alias'] = aliases;
    }
    return result;
  });
}

module.exports = withHealthConnectDelegate;
