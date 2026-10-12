import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

interface SuccessBannerProps {
  t: (k: string) => string;
}

export function SuccessBanner({ t }: SuccessBannerProps) {
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successText}>{t('coach.routine.saved')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    marginBottom: space.lg,
    padding: space.md,
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
