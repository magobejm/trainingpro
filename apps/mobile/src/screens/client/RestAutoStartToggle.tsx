import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { useRestPreferencesStore } from '../../store/rest-preferences.store';

export function RestAutoStartToggle(): React.JSX.Element {
  const { t } = useTranslation();
  const enabled = useRestPreferencesStore((state) => state.autoStartRest);
  const setEnabled = useRestPreferencesStore((state) => state.setAutoStartRest);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{t('mobile.client.rest.autoStart')}</Text>
      <Switch accessibilityLabel={t('mobile.client.rest.autoStart')} onValueChange={setEnabled} value={enabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusMd,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
