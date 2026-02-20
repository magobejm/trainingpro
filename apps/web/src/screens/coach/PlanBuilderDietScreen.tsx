import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';

export function PlanBuilderDietScreen(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t('coach.builder.diet.title')}</Text>
      <Text style={styles.subtitle}>{t('coach.builder.diet.underConstruction')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    color: '#627285',
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    color: '#0e1a2f',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
});
