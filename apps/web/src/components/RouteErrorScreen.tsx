import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';

export function RouteErrorScreen(): React.JSX.Element {
  const error = useRouteError();
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : '';
  const isModuleError =
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed/i.test(
      message,
    );
  return (
    <View style={styles.page}>
      <View accessibilityRole="alert" style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          {t(isModuleError ? 'routeError.module.title' : 'routeError.generic.title')}
        </Text>
        <Text style={styles.message}>{t(isModuleError ? 'routeError.module.message' : 'routeError.generic.message')}</Text>
        <Text style={styles.note}>{t('routeError.reload.note')}</Text>
        <Button label={t('routeError.reload')} onPress={() => window.location.reload()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: space.xl,
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  message: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 24 },
  note: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
});
