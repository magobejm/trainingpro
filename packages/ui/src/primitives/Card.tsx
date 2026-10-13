import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../theme/motion';
import { colors, radius, shadow, space } from '../theme/tokens';

export type CardProps = {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card(props: CardProps): React.JSX.Element {
  const { padded = true } = props;
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const style = [
    styles.base,
    padded ? styles.padded : null,
    props.elevated ? styles.elevated : null,
    props.interactive && !reduced && hovered ? styles.lift : null,
    props.style,
  ];
  if (!props.interactive) {
    return (
      <View style={style} testID={props.testID}>
        {props.children}
      </View>
    );
  }
  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={style} testID={props.testID}>
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
  lift: {
    transform: [{ translateY: -2 }],
    ...shadow.md,
    // @ts-expect-error web-only
    transitionDuration: '150ms',
    transitionProperty: 'transform, box-shadow',
  },
  padded: {
    padding: space.lg,
  },
});
