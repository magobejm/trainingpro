import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { classifyQueryStatus, type QueryStatus, type QueryStatusInput } from '../data/classify-query-status';
import { FAILURE_KINDS, readCopy } from './async-status.copy';
import { requestSignIn } from '../data/session-end';
import { Button, colors, EmptyState, fontSize, SkeletonList, space, type SkeletonVariant } from '@trainerpro/ui';
import { EmptyIllustration, type EmptyIllustrationKind } from './EmptyIllustrations';

type AsyncStatusProps = {
  emptyActionLabel?: string;
  emptyIllustration?: EmptyIllustrationKind;
  emptyMessage?: string;
  emptyTitle: string;
  kind: Exclude<QueryStatus, 'ready'>;
  messageOverride?: string;
  onEmptyAction?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
  skeleton?: SkeletonVariant;
  titleOverride?: string;
};

type QueryResultProps = QueryStatusInput & {
  emptyActionLabel?: string;
  emptyIllustration?: EmptyIllustrationKind;
  emptyMessage?: string;
  emptyTitle: string;
  onEmptyAction?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
  skeleton?: SkeletonVariant;
};

export function QueryResult(props: QueryResultProps): React.JSX.Element | null {
  const kind = classifyQueryStatus(props);
  if (kind === 'ready') {
    return null;
  }
  return (
    <AsyncStatus
      emptyActionLabel={props.emptyActionLabel}
      emptyIllustration={props.emptyIllustration}
      emptyMessage={props.emptyMessage}
      emptyTitle={props.emptyTitle}
      kind={kind}
      onEmptyAction={props.onEmptyAction}
      onClearFilters={props.onClearFilters}
      onRetry={props.onRetry}
      skeleton={props.skeleton}
    />
  );
}

export function AsyncStatus(props: AsyncStatusProps): React.JSX.Element {
  const { t } = useTranslation();
  const copy = readCopy(props, t);
  if (props.kind === 'loading') return <LoadingState label={copy.title} variant={props.skeleton ?? 'panel'} />;
  if (props.kind === 'empty' || props.kind === 'noResults') {
    return (
      <IllustratedEmpty
        copy={copy}
        emptyActionLabel={props.kind === 'empty' ? props.emptyActionLabel : t('common.clearFilters')}
        emptyIllustration={props.emptyIllustration ?? 'generic'}
        onEmptyAction={props.kind === 'empty' ? props.onEmptyAction : props.onClearFilters}
      />
    );
  }
  const role = FAILURE_KINDS.has(props.kind) ? 'alert' : 'text';
  return (
    <View accessibilityLabel={copy.title} accessibilityRole={role} style={styles.panel}>
      <Text style={styles.title}>{copy.title}</Text>
      {copy.message ? <Text style={styles.message}>{copy.message}</Text> : null}
      <StatusAction kind={props.kind} label={copy.action} onRetry={props.onRetry} />
    </View>
  );
}

export function LoadingState(props: { label: string; variant?: SkeletonVariant }): React.JSX.Element {
  return (
    <View accessibilityLabel={props.label} accessibilityRole="progressbar" style={styles.panel}>
      <SkeletonList variant={props.variant ?? 'panel'} />
    </View>
  );
}

function IllustratedEmpty(props: {
  copy: { message?: string; title: string };
  emptyActionLabel?: string;
  emptyIllustration?: EmptyIllustrationKind;
  onEmptyAction?: () => void;
}): React.JSX.Element {
  return (
    <EmptyState
      actionLabel={props.emptyActionLabel}
      icon={props.emptyIllustration ? <EmptyIllustration kind={props.emptyIllustration} /> : undefined}
      message={props.copy.message}
      onAction={props.onEmptyAction}
      title={props.copy.title}
    />
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
