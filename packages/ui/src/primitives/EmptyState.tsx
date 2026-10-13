import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, space } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

export type EmptyStateProps = {
  actionLabel?: string;
  icon?: React.ReactNode;
  message?: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState(props: EmptyStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      {props.icon ? <View style={styles.icon}>{props.icon}</View> : null}
      <Text style={[styles.title, { color: theme.colors.text }]}>{props.title}</Text>
      {props.message ? <Text style={[styles.message, { color: theme.colors.textMuted }]}>{props.message}</Text> : null}
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
  icon: {
    alignItems: 'center',
    maxHeight: 120,
    maxWidth: 160,
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
