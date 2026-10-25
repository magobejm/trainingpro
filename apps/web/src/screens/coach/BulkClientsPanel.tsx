import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, TextField, colors, fontSize, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import type { ClientView } from '../../data/hooks/useClientsQuery';
import { useAuthStore } from '../../store/auth.store';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type BulkRow = { clientId: string; message?: string; status: 'error' | 'ok' };
type Result = { results: BulkRow[] };

export function BulkClientsPanel(props: { clients: ClientView[]; t: Translate }): React.JSX.Element | null {
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
    <View style={{ gap: space.xs, marginBottom: space.md }}>
      <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{props.t('coach.bulk.title')}</Text>
      <Button
        label={props.t('coach.bulk.visible')}
        onPress={() => setSelected(props.clients.map((client) => client.id))}
        variant="secondary"
      />
      {props.clients.map((client) => (
        <Pressable accessibilityRole="checkbox" key={client.id} onPress={() => toggle(client.id)}>
          <Text style={{ color: selected.includes(client.id) ? colors.primary : colors.text, fontSize: fontSize.sm }}>
            {selected.includes(client.id) ? '☑' : '☐'} {client.firstName} {client.lastName}
          </Text>
        </Pressable>
      ))}
      <TextField label={props.t('coach.bulk.message')} onChangeText={setMessage} value={message} />
      <Button disabled={selected.length === 0} label={props.t('coach.bulk.send')} onPress={() => void send()} />
      {summary?.results.map((row) => (
        <Text key={row.clientId} style={{ color: colors.text, fontSize: fontSize.sm }}>
          {props.t('coach.bulk.result', { name: nameOf(props.clients, row.clientId), status: row.status })}
        </Text>
      ))}
    </View>
  );
}

function nameOf(clients: ClientView[], id: string): string {
  const client = clients.find((item) => item.id === id);
  return client ? `${client.firstName} ${client.lastName}` : id;
}
