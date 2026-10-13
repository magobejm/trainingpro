import React, { useState } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { colors, fontSize, radius, shadow, space } from '../theme/tokens';

const POINTER_NONE = 'none' as const;

/** Texto que aparece al pasar el ratón o al enfocar, y que el lector de pantalla lee siempre. */
export function Tooltip(props: { children: React.ReactNode; label: string }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const hover = {
    onBlur: () => setOpen(false),
    onFocus: () => setOpen(true),
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
  } as ViewProps;
  return (
    <View accessibilityLabel={props.label} style={styles.host} {...hover}>
      {props.children}
      {open ? (
        <View pointerEvents={POINTER_NONE} style={styles.bubble}>
          <Text style={styles.text}>{props.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    bottom: '100%',
    left: 0,
    marginBottom: space.xs,
    maxWidth: 240,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    position: 'absolute',
    zIndex: 5,
    ...shadow.md,
  },
  host: {
    position: 'relative',
  },
  text: {
    color: colors.onPrimary,
    fontSize: fontSize.xs,
  },
});
