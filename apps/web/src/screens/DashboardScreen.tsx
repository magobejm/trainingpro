import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import '../i18n';

export function DashboardScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('screen.dashboard.title')}</Text>
      <Text>{t('screen.dashboard.subtitle')}</Text>
    </View>
  );
}
