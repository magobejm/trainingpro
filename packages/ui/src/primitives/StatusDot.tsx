import React from 'react';
import { StyleSheet, View } from 'react-native';
import { type BadgeTone } from './Badge';
import { Tooltip } from './Tooltip';
import { colors } from '../theme/tokens';

const DOT_COLOR: Record<BadgeTone, string> = {
  danger: colors.danger,
  info: colors.info,
  neutral: colors.textMuted,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
};

/** Punto de color con el motivo en un aviso al pasar el ratón. */
export function StatusDot(props: { reason: string; tone: BadgeTone }): React.JSX.Element {
  return (
    <Tooltip label={props.reason}>
      <View style={[styles.dot, { backgroundColor: DOT_COLOR[props.tone] }]} />
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
