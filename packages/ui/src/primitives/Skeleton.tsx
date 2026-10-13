import React from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../theme/motion';
import { colors, radius } from '../theme/tokens';

export type SkeletonProps = {
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
};

/** Bloque gris que parpadea mientras carga el contenido real. */
export function Skeleton(props: SkeletonProps): React.JSX.Element {
  const reduced = useReducedMotion();
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.base,
        {
          borderRadius: props.radius ?? radius.md,
          height: props.height ?? 16,
          opacity: reduced ? 0.7 : undefined,
          width: props.width ?? '100%',
        },
        reduced ? null : styles.pulse,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
  pulse: {
    // @ts-expect-error web-only
    animationDuration: '1400ms',
    animationIterationCount: 'infinite',
    animationName: 'trainerpro-skeleton',
    animationTimingFunction: 'ease-in-out',
  },
});
