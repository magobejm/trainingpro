import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ScrollView, Text, View } from 'react-native';
import { Button, EmptyState, IconButton, TextField, colors, fontSize, radius, space, useToast } from '@trainerpro/ui';
import { useArchivedClientsPagedQuery } from '../../../data/hooks/usePagedResources';
import { loadNextPage } from '../../../data/hooks/usePagedList';
import { useRestoreClientMutation } from '../../../data/hooks/useClientMutations';
import type { ArchivedClientView } from '../../../data/hooks/usePagedResources';

type Props = { onClose: () => void; t: (key: string) => string; visible: boolean };

export function ArchivedClientsDrawer(props: Props): React.JSX.Element | null {
  const [search, setSearch] = useState('');
  const query = useArchivedClientsPagedQuery(search, props.visible);
  const restore = useRestoreClientMutation();
  const toast = useToast();
  if (!props.visible || typeof document === 'undefined') return null;
  const onRestore = async (client: ArchivedClientView) => {
    try {
      await restore.mutateAsync(client.id);
      toast.success(props.t('coach.clients.archived.restored'));
    } catch (error) {
      const isConflict = typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
      toast.error(props.t(isConflict ? 'coach.clients.archived.restoreConflict' : 'coach.clients.archived.restoreError'));
    }
  };
  return createPortal(
    <>
      <div style={drawerStyle}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text style={styles.icon}>{'✉'}</Text>
            <View>
              <Text style={styles.title}>{props.t('coach.clients.archived.title')}</Text>
              <Text style={styles.subtitle}>{props.t('coach.clients.archived.subtitle')}</Text>
            </View>
          </View>
          <IconButton
            accessibilityLabel={props.t('common.close')}
            icon={(color) => <Text style={{ color, fontSize: 24 }}>{'×'}</Text>}
            onPress={props.onClose}
          />
        </View>
        <TextField
          label={props.t('coach.clients.archived.search')}
          onChangeText={setSearch}
          placeholder={props.t('coach.clients.archived.searchPlaceholder')}
          value={search}
        />
        {query.isLoading ? <Text style={styles.status}>{props.t('common.loading')}</Text> : null}
        {query.isError ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{props.t('coach.clients.archived.loadError')}</Text>
            <Button label={props.t('common.retry')} onPress={() => void query.refetch()} size="sm" variant="secondary" />
          </View>
        ) : null}
        {!query.isLoading && !query.isError && query.items.length === 0 ? (
          <EmptyState title={props.t('coach.clients.archived.empty')} />
        ) : null}
        <ScrollView style={styles.list} onScroll={(event) => loadNextPage(event, query)} scrollEventThrottle={200}>
          {query.items.map((client) => (
            <ArchivedClientRow
              key={client.id}
              client={client}
              disabled={restore.isPending}
              onRestore={() => void onRestore(client)}
              t={props.t}
            />
          ))}
          {query.isFetchingNextPage ? <Text style={styles.status}>{props.t('common.loading')}</Text> : null}
        </ScrollView>
      </div>
      <div onClick={props.onClose} style={backdropStyle} />
    </>,
    document.body,
  );
}

function ArchivedClientRow(props: {
  client: ArchivedClientView;
  disabled: boolean;
  onRestore: () => void;
  t: Props['t'];
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.clientDetails}>
        <Text style={styles.name}>{`${props.client.firstName} ${props.client.lastName}`.trim()}</Text>
        <Text style={styles.detail}>{props.client.email}</Text>
        <Text
          style={styles.detail}
        >{`${props.t('coach.clients.archived.archivedAt')} ${formatDate(props.client.archivedAt)}`}</Text>
      </View>
      <Button
        disabled={props.disabled}
        label={props.disabled ? props.t('coach.clients.archived.restoring') : props.t('coach.clients.archived.restore')}
        onPress={props.onRestore}
        size="sm"
        variant="secondary"
      />
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

const styles = {
  clientDetails: { flex: 1, gap: 3, minWidth: 0 } as const,
  detail: { color: colors.textMuted, fontSize: fontSize.xs } as const,
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' } as const,
  heading: { alignItems: 'center', flexDirection: 'row', gap: space.md } as const,
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    color: colors.primary,
    fontSize: fontSize.md,
    overflow: 'hidden',
    padding: space.sm,
  } as const,
  list: { flex: 1, marginTop: space.md } as const,
  name: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' } as const,
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
  } as const,
  status: { alignItems: 'center', gap: space.sm, padding: space.lg } as const,
  statusText: { color: colors.textMuted, fontSize: fontSize.sm } as const,
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as const,
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' } as const,
};

const drawerStyle: React.CSSProperties = {
  background: colors.surface,
  borderLeft: `1px solid ${colors.border}`,
  borderRadius: '24px 0 0 24px',
  boxShadow: '-12px 0 36px var(--tp-shadowColor)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  height: '100vh',
  maxWidth: 480,
  padding: 24,
  position: 'fixed',
  right: 0,
  top: 0,
  width: 'min(94vw, 480px)',
  zIndex: 1000,
};
const backdropStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.24)',
  inset: 0,
  position: 'fixed',
  zIndex: 999,
};
