import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ClientView, ClientObjective } from '@trainerpro/shared';
import { useCoachAuth, useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { createApiClient } from '../../data/api-client';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { CoachButton, CoachField, CoachPage, CoachSelect, CoachStatus } from '../../features/coach/CoachUi';
import { LIGHT } from '../../theme/light';
import { useCoachCopy, type CoachCopyKey } from './coach-copy';
import { clientFormPayload, clientToForm, emptyClientForm, type CoachClientForm } from './coach-client-model';
import { useClientAvatarUpload } from './coach-client-upload';
type Props = {
  clientId: string;
  onOpen: (feature: string, clientId?: string) => void;
  onChat: (id: string) => void;
  onArchived: () => void;
};
export function ClientProfileScreen(props: Props): React.JSX.Element {
  const c = useCoachCopy();
  const query = useCoachQuery<ClientView>('/clients/' + props.clientId);
  const [editing, setEditing] = useState(false);
  if (!query.data)
    return (
      <CoachPage title={c('profile')}>
        <CoachStatus query={query} />
      </CoachPage>
    );
  if (editing)
    return (
      <CoachClientEditor
        key={props.clientId}
        client={query.data}
        onDone={() => {
          void query.refetch().finally(() => setEditing(false));
        }}
      />
    );
  return (
    <CoachPage title={[query.data.firstName, query.data.lastName].join(' ')}>
      <CoachStatus query={query} />
      <ClientProfileBody {...props} client={query.data} onEdit={() => setEditing(true)} />
    </CoachPage>
  );
}
function ClientProfileBody(props: Props & { client: ClientView; onEdit: () => void }) {
  const c = useCoachCopy();
  const write = useCoachWrite<{ temporaryPassword: string }>();
  const avatar = useClientAvatarUpload(props.clientId);
  const [confirmation, setConfirmation] = useState<'archive' | 'reset' | null>(null);
  const [password, setPassword] = useState('');
  const run = async () => {
    try {
      const result = await write.mutateAsync({
        path: '/clients/' + props.clientId + (confirmation === 'reset' ? '/reset-password' : ''),
        method: confirmation === 'reset' ? 'POST' : 'DELETE',
      });
      if (confirmation === 'reset') setPassword(result.temporaryPassword);
      else props.onArchived();
      setConfirmation(null);
    } catch {
      /* mutation reports error */
    }
  };
  return (
    <View style={styles.body}>
      {props.client.avatarUrl ? <Image source={{ uri: props.client.avatarUrl }} style={styles.avatar} /> : null}
      <Text style={styles.text}>{props.client.email}</Text>
      <Text style={styles.text}>{props.client.objective}</Text>
      <CoachButton label={c('edit')} onPress={props.onEdit} />
      <CoachButton label={c('avatar')} loading={avatar.isPending} onPress={() => avatar.mutate()} />
      <CoachButton label={c('chat')} onPress={() => props.onChat(props.clientId)} />
      {(
        [
          'progress',
          'sessions',
          'wellness',
          'tests',
          'measures',
          'photos',
          'routines',
          'nutrition',
          'notes',
          'incidents',
        ] as const
      ).map((feature) => (
        <CoachButton key={feature} label={c(feature)} onPress={() => props.onOpen(feature, props.clientId)} />
      ))}
      <CoachButton label={c('reset')} onPress={() => setConfirmation('reset')} />
      <CoachButton danger label={c('archive')} onPress={() => setConfirmation('archive')} />
      {confirmation ? (
        <View style={styles.confirm}>
          <Text style={styles.text}>{c(confirmation === 'archive' ? 'archiveAsk' : 'resetAsk')}</Text>
          <CoachButton
            danger={confirmation === 'archive'}
            label={c(confirmation === 'archive' ? 'archiveConfirm' : 'resetConfirm')}
            loading={write.isPending}
            onPress={() => void run()}
          />
          <CoachButton label={c('cancel')} onPress={() => setConfirmation(null)} />
        </View>
      ) : null}
      {password ? (
        <View style={styles.confirm}>
          <Text style={styles.text}>{c('password')}</Text>
          <Text selectable style={styles.password}>
            {password}
          </Text>
          <CoachButton label={c('dismiss')} onPress={() => setPassword('')} />
        </View>
      ) : null}
    </View>
  );
}
export function CoachClientCreateScreen(props: { onCreated: (id: string) => void }): React.JSX.Element {
  return <CoachClientEditor onCreated={props.onCreated} />;
}
type Created = {
  client: { id: string };
  credentials: { temporaryPassword: string | null; userCreated: boolean };
};
function CoachClientEditor(props: { client?: ClientView; onDone?: () => void; onCreated?: (id: string) => void }) {
  const c = useCoachCopy();
  const write = useCoachWrite<Created>();
  const objectives = useCoachQuery<{ items: ClientObjective[] }>('/clients/catalog/objectives');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const auth = useCoachAuth();
  const [latestVersion, setLatestVersion] = useState(props.client?.updatedAt);
  const [serverChanged, setServerChanged] = useState(false);
  const draft = useCoachDraft<CoachClientForm>(
    'client:' + (props.client?.id ?? 'create'),
    props.client ? clientToForm(props.client as unknown as Record<string, unknown>) : emptyClientForm,
    latestVersion,
  );
  const set = (key: keyof CoachClientForm, value: string) => draft.setValue((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    try {
      setError('');
      const body = clientFormPayload(draft.value, Boolean(props.client));
      if (props.client) {
        const latest = await createApiClient(auth).get<ClientView>('/clients/' + props.client.id);
        if (latest.updatedAt !== latestVersion) {
          setLatestVersion(latest.updatedAt);
          setServerChanged(true);
          return;
        }
      }
      const result = await write.mutateAsync({
        path: '/clients' + (props.client ? '/' + props.client.id : ''),
        method: props.client ? 'PATCH' : 'POST',
        body,
      });
      await draft.clear();
      if (props.client) props.onDone?.();
      else setCreated(result);
    } catch {
      setError(c('invalid'));
    }
  };
  return (
    <CoachPage title={c(props.client ? 'edit' : 'newClient')}>
      {created ? (
        <View style={styles.body}>
          <Text style={styles.text}>{c('created')}</Text>
          <Text style={styles.text}>{created.credentials.temporaryPassword ? c('credentials') : c('noPassword')}</Text>
          {created.credentials.temporaryPassword ? (
            <Text selectable style={styles.password}>
              {created.credentials.temporaryPassword}
            </Text>
          ) : null}
          <CoachButton label={c('profile')} onPress={() => props.onCreated?.(created.client.id)} />
        </View>
      ) : (
        <View style={styles.body}>
          {draft.conflict || serverChanged ? (
            <View style={styles.confirm}>
              <Text style={styles.error}>{c('conflict')}</Text>
              <CoachButton
                label={c('discard')}
                onPress={() => {
                  setServerChanged(false);
                  void draft.clear();
                  props.onDone?.();
                }}
              />
            </View>
          ) : null}
          <ClientFormFields value={draft.value} set={set} objectives={objectives.data?.items ?? []} />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <CoachButton
            label={c('save')}
            disabled={!draft.ready || draft.conflict || serverChanged}
            loading={write.isPending}
            onPress={() => void submit()}
          />
          {props.onDone ? <CoachButton label={c('cancel')} onPress={props.onDone} /> : null}
        </View>
      )}
    </CoachPage>
  );
}
function ClientFormFields(props: {
  value: CoachClientForm;
  set: (key: keyof CoachClientForm, value: string) => void;
  objectives: ClientObjective[];
}) {
  const c = useCoachCopy();
  return (
    <>
      {(Object.keys(emptyClientForm) as (keyof CoachClientForm)[]).map((key) =>
        key === 'objectiveId' ? (
          <CoachSelect
            key={key}
            label={c(key)}
            value={props.value[key]}
            onChange={(value) => props.set(key, value)}
            options={[
              { value: '', label: c('none') },
              ...props.objectives.map((item) => ({
                value: item.id,
                label: item.label,
              })),
            ]}
          />
        ) : (
          <CoachField
            key={key}
            label={c(key as CoachCopyKey)}
            value={props.value[key]}
            onChange={(value) => props.set(key, value)}
            numeric={['heightCm', 'weightKg', 'waistCm', 'hipCm', 'fcMax', 'fcRest'].includes(key)}
            multiline={['injuries', 'allergies', 'considerations', 'notes'].includes(key)}
          />
        ),
      )}
    </>
  );
}
const styles = StyleSheet.create({
  body: { gap: 12 },
  text: { color: LIGHT.text, fontSize: 15 },
  error: { color: LIGHT.error, fontSize: 14 },
  confirm: {
    padding: 16,
    gap: 12,
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
  },
  password: { color: LIGHT.textStrong, fontSize: 20, fontWeight: '700' },
  avatar: { width: 80, height: 80, borderRadius: LIGHT.radiusFull },
});
