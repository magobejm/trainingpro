import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, space } from '../theme/tokens';
import { Button } from './Button';

export type EmptyStateProps = {
  actionLabel?: string;
  icon?: React.ReactNode;
  message?: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState(props: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      {props.icon}
      <Text style={styles.title}>{props.title}</Text>
      {props.message ? <Text style={styles.message}>{props.message}</Text> : null}
      {props.actionLabel && props.onAction ? (
        <Button label={props.actionLabel} onPress={props.onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: space.sm,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    gap: space.sm,
    justifyContent: 'center',
    padding: space.xxl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
