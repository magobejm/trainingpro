import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme/tokens';

export type SkeletonProps = {
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
};

/** Bloque gris que parpadea mientras carga el contenido real. */
export function Skeleton(props: SkeletonProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { duration: 700, toValue: 1, useNativeDriver: false }),
        Animated.timing(opacity, { duration: 700, toValue: 0.5, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      accessibilityElementsHidden
      style={[
        styles.base,
        { borderRadius: props.radius ?? radius.md, height: props.height ?? 16, opacity, width: props.width ?? '100%' },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
});
