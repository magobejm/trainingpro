import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '../theme/tokens';

export type BadgeTone = 'danger' | 'info' | 'neutral' | 'primary' | 'success' | 'warning';

const TONES: Record<BadgeTone, { background: string; text: string }> = {
  danger: { background: colors.dangerSoft, text: colors.danger },
  info: { background: colors.infoSoft, text: colors.info },
  neutral: { background: colors.background, text: colors.textMuted },
  primary: { background: colors.primarySoft, text: colors.primaryHover },
  success: { background: colors.successSoft, text: colors.success },
  warning: { background: colors.warningSoft, text: colors.warning },
};

export function Badge(props: { label: string; tone?: BadgeTone }): React.JSX.Element {
  const tone = TONES[props.tone ?? 'neutral'];
  return (
    <View style={[styles.base, { backgroundColor: tone.background }]}>
      <Text style={[styles.label, { color: tone.text }]}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
