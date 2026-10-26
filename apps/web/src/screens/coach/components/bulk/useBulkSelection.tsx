import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@trainerpro/ui';
import type { ClientView } from '../../../../data/hooks/useClientsQuery';
import type { Translate } from './BulkActionFields';
import { BulkActionBar } from './BulkActionBar';
import { BulkActionModal, type BulkKind } from './BulkActionModal';
import { bulkStyles as styles } from './bulk.styles';

export function useBulkSelection(clients: ClientView[]) {
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [kind, setKind] = useState<BulkKind | null>(null);
  useEffect(() => {
    const known = new Set(clients.map((client) => client.id));
    setSelectedIds((current) => (current.every((id) => known.has(id)) ? current : current.filter((id) => known.has(id))));
  }, [clients]);
  const names = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, `${client.firstName} ${client.lastName}`.trim()])),
    [clients],
  );
  return {
    active,
    exit: () => {
      setActive(false);
      setSelectedIds([]);
      setKind(null);
    },
    kind,
    names,
    selectedIds,
    selectVisible: () => setSelectedIds(clients.map((client) => client.id)),
    clear: () => setSelectedIds([]),
    setActive,
    setKind,
    toggle: (id: string) =>
      setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
  };
}

export type BulkSelection = ReturnType<typeof useBulkSelection>;

export function BulkSelectionToolbar(props: { selection: BulkSelection; t: Translate }): React.JSX.Element {
  const { selection: sel, t } = props;
  if (!sel.active) {
    return (
      <View style={styles.toolbar}>
        <Button label={t('coach.bulk.title')} onPress={() => sel.setActive(true)} variant="secondary" />
      </View>
    );
  }
  return (
    <View style={styles.toolbar}>
      <Button label={t('coach.bulk.visible')} onPress={sel.selectVisible} variant="secondary" />
      <Button disabled={sel.selectedIds.length === 0} label={t('coach.bulk.clear')} onPress={sel.clear} variant="ghost" />
      <Button label={t('coach.bulk.exit')} onPress={sel.exit} variant="ghost" />
      <Text style={styles.barCount}>{t('coach.bulk.selected', { count: sel.selectedIds.length })}</Text>
    </View>
  );
}

export function BulkSelectionBar(props: { selection: BulkSelection; t: Translate }): React.JSX.Element | null {
  const { selection: sel, t } = props;
  if (!sel.active || sel.kind) return null;
  return <BulkActionBar count={sel.selectedIds.length} onCancel={sel.exit} onPick={sel.setKind} t={t} />;
}

export function BulkSelectionOverlay(props: { selection: BulkSelection; t: Translate }): React.JSX.Element | null {
  const { selection: sel, t } = props;
  if (!sel.active) return null;
  return (
    <>
      {sel.kind ? (
        <BulkActionModal clientIds={sel.selectedIds} kind={sel.kind} names={sel.names} onClose={sel.exit} t={t} />
      ) : null}
    </>
  );
}
