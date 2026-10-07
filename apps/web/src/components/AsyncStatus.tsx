import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { classifyQueryStatus, type QueryStatus, type QueryStatusInput } from '../data/classify-query-status';
import { requestSignIn } from '../data/session-end';

const BUTTON_ROLE = 'button' as const;
const FAILURES = new Set<QueryStatus>(['forbidden', 'network', 'server', 'sessionExpired']);
const SPINNER_COLOR = '#1c74e9';

type AsyncStatusProps = {
  emptyMessage?: string;
  emptyTitle: string;
  kind: Exclude<QueryStatus, 'ready'>;
  onRetry?: () => void;
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
  const role = props.kind === 'loading' ? 'progressbar' : FAILURES.has(props.kind) ? 'alert' : 'text';
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

function readCopy(props: AsyncStatusProps, t: (key: string) => string): { action: string; message: string; title: string } {
  if (props.kind === 'empty') {
    return { action: '', message: props.emptyMessage ?? '', title: props.emptyTitle };
  }
  if (props.kind === 'noResults') {
    return { action: '', message: t('coach.status.noResults.message'), title: t('coach.status.noResults.title') };
  }
  if (props.kind === 'sessionExpired') {
    return {
      action: t('coach.status.signIn'),
      message: t('auth.login.sessionExpired'),
      title: t('coach.status.sessionExpired.title'),
    };
  }
  return {
    action: t('coach.status.retry'),
    message: t(`coach.status.${props.kind}.message`),
    title: t(`coach.status.${props.kind}.title`),
  };
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  panel: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
