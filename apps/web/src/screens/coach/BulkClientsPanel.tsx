import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import type { ClientView } from '../../data/hooks/useClientsQuery';
import { useAuthStore } from '../../store/auth.store';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type BulkRow = { clientId: string; message?: string; status: 'error' | 'ok' };
type Result = { results: BulkRow[] };

export function BulkClientsPanel(props: { clients: ClientView[]; t: Translate }): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState(props.t('coach.bulk.sample'));
  const [summary, setSummary] = useState<Result | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  if (props.clients.length === 0) return null;
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const send = async () => {
    const result = await createApiClient({ accessToken: accessToken ?? '', activeRole: 'coach' }).post<Result>(
      '/clients/bulk',
      {
        action: { action: 'broadcastMessage', message },
        clientIds: selected,
      },
    );
    setSummary(result);
  };
  return (
    <View style={styles.card}>
      <BulkHeader count={selected.length} onToggle={() => setOpen((value) => !value)} open={open} t={props.t} />
      {open ? (
        <View style={styles.body}>
          <View style={styles.toolbar}>
            <Button
              label={props.t('coach.bulk.visible')}
              onPress={() => setSelected(props.clients.map((client) => client.id))}
              variant="secondary"
            />
            <Button
              disabled={selected.length === 0}
              label={props.t('coach.bulk.clear')}
              onPress={() => setSelected([])}
              variant="ghost"
            />
          </View>
          <View style={styles.chips}>
            {props.clients.map((client) => (
              <ClientChip client={client} key={client.id} onPress={toggle} selected={selected.includes(client.id)} />
            ))}
          </View>
          <TextField label={props.t('coach.bulk.message')} onChangeText={setMessage} value={message} />
          <Text style={styles.hint}>{props.t('coach.bulk.hint')}</Text>
          <View style={styles.sendRow}>
            <Button disabled={selected.length === 0} label={props.t('coach.bulk.send')} onPress={() => void send()} />
          </View>
          <BulkSummary clients={props.clients} summary={summary} t={props.t} />
        </View>
      ) : null}
    </View>
  );
}

function BulkHeader(props: { count: number; onToggle: () => void; open: boolean; t: Translate }): React.JSX.Element {
  const actionKey = props.open ? 'coach.bulk.close' : 'coach.bulk.open';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: props.open }}
      onPress={props.onToggle}
      style={styles.header}
    >
      <View style={styles.headerText}>
        <Text style={styles.title}>{props.t('coach.bulk.title')}</Text>
        {props.count > 0 ? <Badge label={props.t('coach.bulk.selected', { count: props.count })} tone="primary" /> : null}
      </View>
      <Text style={styles.toggle}>{props.t(actionKey)}</Text>
    </Pressable>
  );
}

function ClientChip(props: { client: ClientView; onPress: (id: string) => void; selected: boolean }): React.JSX.Element {
  const { client, selected } = props;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={() => props.onPress(client.id)}
      style={[styles.chip, selected ? styles.chipOn : null]}
    >
      <Text style={[styles.chipMark, selected ? styles.chipTextOn : null]}>{selected ? '✓' : '+'}</Text>
      <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>
        {client.firstName} {client.lastName}
      </Text>
    </Pressable>
  );
}

function BulkSummary(props: { clients: ClientView[]; summary: Result | null; t: Translate }): React.JSX.Element | null {
  if (!props.summary) return null;
  return (
    <View style={styles.summary}>
      {props.summary.results.map((row) => (
        <View key={row.clientId} style={styles.summaryRow}>
          <Text style={styles.summaryName}>{nameOf(props.clients, row.clientId)}</Text>
          <Badge
            label={props.t(row.status === 'ok' ? 'coach.bulk.ok' : 'coach.bulk.error')}
            tone={row.status === 'ok' ? 'success' : 'danger'}
          />
        </View>
      ))}
    </View>
  );
}

function nameOf(clients: ClientView[], id: string): string {
  const client = clients.find((item) => item.id === id);
  return client ? `${client.firstName} ${client.lastName}` : id;
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.md },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: space.md,
    padding: space.lg,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipMark: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.sm },
  chipTextOn: { color: colors.onPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  sendRow: { alignItems: 'flex-start' },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  summaryName: { color: colors.text, fontSize: fontSize.sm },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  toggle: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  toolbar: { flexDirection: 'row', gap: space.sm },
});
