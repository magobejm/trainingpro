import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { colors, fontSize, space } from '@trainerpro/ui';

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
    gap: space.md,
    justifyContent: 'center',
    padding: space.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
});
