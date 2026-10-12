import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { classifyQueryStatus, type QueryStatus, type QueryStatusInput } from '../data/classify-query-status';
import { FAILURE_KINDS, readCopy } from './async-status.copy';
import { requestSignIn } from '../data/session-end';
import { Button, colors, fontSize, space } from '@trainerpro/ui';

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
    return <Button label={props.label} onPress={requestSignIn} style={styles.button} />;
  }
  if ((props.kind === 'network' || props.kind === 'server') && props.onRetry) {
    return <Button label={props.label} onPress={props.onRetry} style={styles.button} />;
  }
  return null;
}

const styles = StyleSheet.create({
  button: {
    marginTop: space.sm,
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
