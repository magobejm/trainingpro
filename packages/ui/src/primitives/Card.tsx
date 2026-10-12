import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, space } from '../theme/tokens';

export type CardProps = {
  children: React.ReactNode;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card(props: CardProps): React.JSX.Element {
  const { padded = true } = props;
  return (
    <View
      style={[styles.base, padded ? styles.padded : null, props.elevated ? styles.elevated : null, props.style]}
      testID={props.testID}
    >
      {props.children}
    </View>
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
  padded: {
    padding: space.lg,
  },
});
