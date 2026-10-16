import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { CoachButton, CoachField, CoachPage, CoachSelect, CoachStatus, ui } from './CoachUi';
import { CoachClientPicker } from './CoachClientPicker';
type Incident = {
  id: string;
  clientId: string;
  description: string;
  severity: string;
  status: string;
  coachResponse?: string;
  adjustmentDraft?: string;
  tag?: string;
  createdAt: string;
};
export function CoachIncidentsScreen({ clientId }: { clientId?: string }) {
  const { t } = useTranslation();
  const [client, setClient] = useState(clientId ?? '');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Incident | null>(null);
  const query = useCoachQuery<Incident[]>(
    '/incidents?' + new URLSearchParams({ ...(client ? { clientId: client } : {}), ...(status ? { status } : {}) }),
  );
  if (selected) return <IncidentEditor key={selected.id} incident={selected} onBack={() => setSelected(null)} />;
  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={query.data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={ui.field}>
          <Text style={ui.title}>{t('coachWorkspace.incidents')}</Text>
          <CoachClientPicker value={client} onChange={setClient} optional cards />
          <CoachSelect
            label={t('coachWorkspace.status')}
            value={status}
            onChange={setStatus}
            options={['', 'OPEN', 'REVIEWED', 'CLOSED'].map((value) => ({
              value,
              label: t('coachWorkspace.status.' + (value || 'all')),
            }))}
          />
          <CoachStatus query={query} empty={query.data?.length === 0} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <Text style={ui.label}>
            {t('coachWorkspace.status.' + item.status)}
            {' · '}
            {item.severity}
          </Text>
          <Text style={ui.text}>{item.description}</Text>
          <Text style={ui.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <CoachButton label={t('coachWorkspace.open')} onPress={() => setSelected(item)} />
        </View>
      )}
    />
  );
}
function IncidentEditor({ incident, onBack }: { incident: Incident; onBack: () => void }) {
  const { t } = useTranslation();
  const query = useCoachQuery<Incident>('/incidents/' + incident.id);
  const write = useCoachWrite();
  const current = query.data ?? incident;
  const draft = useCoachDraft('incident:' + incident.id, {
    response: incident.coachResponse ?? '',
    tag: incident.tag ?? '',
    adjustmentDraft: incident.adjustmentDraft ?? '',
  });
  return (
    <CoachPage title={t('coachWorkspace.incidents')} onBack={onBack}>
      <CoachStatus query={query} />
      <Text style={ui.text}>{current.description}</Text>
      <Text style={ui.label}>{t('coachWorkspace.status.' + current.status)}</Text>
      {current.coachResponse ? <Text style={ui.text}>{current.coachResponse}</Text> : null}
      {current.status === 'OPEN' ? (
        <CoachButton
          label={t('coachWorkspace.review')}
          disabled={write.isPending}
          onPress={() => write.mutate({ path: `/incidents/${incident.id}/review` })}
        />
      ) : null}
      <CoachField
        label={t('coachWorkspace.response')}
        value={draft.value.response}
        onChange={(response) => draft.setValue((old) => ({ ...old, response }))}
        multiline
      />
      <CoachButton
        label={t('coachWorkspace.send')}
        loading={write.isPending}
        disabled={draft.value.response.trim().length < 2}
        onPress={() =>
          void write
            .mutateAsync({ path: `/incidents/${incident.id}/respond`, body: { response: draft.value.response } })
            .then(() => draft.clear())
            .catch(() => undefined)
        }
      />
      <CoachField
        label={t('coachWorkspace.tag')}
        value={draft.value.tag}
        onChange={(tag) => draft.setValue((old) => ({ ...old, tag }))}
      />
      <CoachButton
        label={t('coachWorkspace.saveTag')}
        disabled={write.isPending}
        onPress={() => write.mutate({ path: `/incidents/${incident.id}/tag`, body: { tag: draft.value.tag } })}
      />
      <CoachField
        label={t('coachWorkspace.adjustment')}
        value={draft.value.adjustmentDraft}
        onChange={(adjustmentDraft) => draft.setValue((old) => ({ ...old, adjustmentDraft }))}
        multiline
      />
      <CoachButton
        label={t('coachWorkspace.save')}
        disabled={write.isPending}
        onPress={() =>
          write.mutate({ path: `/incidents/${incident.id}/adjustment-draft`, body: { draft: draft.value.adjustmentDraft } })
        }
      />
    </CoachPage>
  );
}

export function CoachIncidentView({ incidentId, onBack }: { incidentId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const query = useCoachQuery<Incident>('/incidents/' + incidentId);
  if (query.data) return <IncidentEditor incident={query.data} onBack={onBack} />;
  return (
    <CoachPage title={t('coachWorkspace.incidents')} onBack={onBack}>
      <CoachStatus query={query} />
    </CoachPage>
  );
}
