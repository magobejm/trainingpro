import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import '../i18n';

export function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('screen.home.title')}</Text>
      <Text>{t('screen.home.subtitle')}</Text>
    </View>
  );
}
