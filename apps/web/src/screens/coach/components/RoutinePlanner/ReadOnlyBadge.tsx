import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

interface ReadOnlyBadgeProps {
  t: (k: string) => string;
}

export function ReadOnlyBadge({ t }: ReadOnlyBadgeProps) {
  return (
    <View style={styles.readOnlyBadge}>
      <Text style={styles.readOnlyText}>{t('coach.routine.readOnlyNotice')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readOnlyBadge: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    marginBottom: space.lg,
    padding: space.md,
  },
  readOnlyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
