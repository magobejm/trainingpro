import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../theme/motion';
import { useTheme } from '../theme/ThemeProvider';
import { colors, radius, shadow, space } from '../theme/tokens';

export type CardProps = {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  densityRow?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card(props: CardProps): React.JSX.Element {
  const { padded = true } = props;
  const reduced = useReducedMotion();
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const style = [
    styles.base,
    Platform.OS !== 'web' ? { backgroundColor: theme.colors.surface, borderColor: theme.colors.border } : null,
    props.interactive && !reduced && Platform.OS === 'web' ? motionStyle : null,
    padded ? styles.padded : null,
    props.elevated ? styles.elevated : null,
    props.interactive && !reduced && hovered ? styles.lift : null,
    props.interactive && (hovered || focused) ? styles.foreground : null,
    props.style,
  ];
  if (!props.interactive) {
    return (
      <View {...(props.densityRow ? { dataSet: { 'density-row': 'true' } } : {})} style={style} testID={props.testID}>
        {props.children}
      </View>
    );
  }
  return (
    <Pressable
      {...(props.densityRow ? { dataSet: { 'density-row': 'true' } } : {})}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={style}
      testID={props.testID}
    >
      {props.children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  elevated: {
    ...shadow.md,
  },
  foreground: {
    zIndex: 1,
  },
  lift: {
    transform: [{ translateY: -2 }],
    ...shadow.md,
  },
  padded: {
    padding: space.lg,
  },
});

const motionStyle = { transitionDuration: '150ms', transitionProperty: 'transform, box-shadow' } as ViewStyle;
