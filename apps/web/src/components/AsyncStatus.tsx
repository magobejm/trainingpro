import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { classifyQueryStatus, type QueryStatus, type QueryStatusInput } from '../data/classify-query-status';
import { FAILURE_KINDS, readCopy } from './async-status.copy';
import { requestSignIn } from '../data/session-end';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const BUTTON_ROLE = 'button' as const;
const SPINNER_COLOR = colors.primary;

type AsyncStatusProps = {
  emptyMessage?: string;
  emptyTitle: string;
  kind: Exclude<QueryStatus, 'ready'>;
  messageOverride?: string;
  onRetry?: () => void;
  titleOverride?: string;
};

type QueryResultProps = QueryStatusInput & {
  emptyMessage?: string;
  emptyTitle: string;
  onRetry?: () => void;
};

export function QueryResult(props: QueryResultProps): React.JSX.Element | null {
  const kind = classifyQueryStatus(props);
  if (kind === 'ready') {
    return null;
  }
  return <AsyncStatus emptyMessage={props.emptyMessage} emptyTitle={props.emptyTitle} kind={kind} onRetry={props.onRetry} />;
}

export function AsyncStatus(props: AsyncStatusProps): React.JSX.Element {
  const { t } = useTranslation();
  const copy = readCopy(props, t);
  const role = props.kind === 'loading' ? 'progressbar' : FAILURE_KINDS.has(props.kind) ? 'alert' : 'text';
  return (
    <View accessibilityLabel={copy.title} accessibilityRole={role} style={styles.panel}>
      {props.kind === 'loading' ? <ActivityIndicator color={SPINNER_COLOR} /> : null}
      <Text style={styles.title}>{copy.title}</Text>
      {copy.message ? <Text style={styles.message}>{copy.message}</Text> : null}
      <StatusAction kind={props.kind} label={copy.action} onRetry={props.onRetry} />
    </View>
  );
}

function StatusAction(props: { kind: QueryStatus; label: string; onRetry?: () => void }): React.JSX.Element | null {
  if (props.kind === 'sessionExpired') {
    return (
      <Pressable
        accessibilityLabel={props.label}
        accessibilityRole={BUTTON_ROLE}
        onPress={requestSignIn}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{props.label}</Text>
      </Pressable>
    );
  }
  if ((props.kind === 'network' || props.kind === 'server') && props.onRetry) {
    return (
      <Pressable
        accessibilityLabel={props.label}
        accessibilityRole={BUTTON_ROLE}
        onPress={props.onRetry}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{props.label}</Text>
      </Pressable>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  buttonText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  panel: {
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
