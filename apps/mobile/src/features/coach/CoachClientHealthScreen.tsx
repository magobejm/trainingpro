import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { ClientProgressPhoto, ClientView } from '@trainerpro/shared';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import type { ClientWellnessResponse } from '../../data/hooks/useClientWellness';
import {
  CoachButton,
  CoachConflict,
  CoachField,
  CoachPage,
  CoachSelect,
  CoachStatus,
  confirmCoachDelete,
  ui,
} from './CoachUi';
import { CoachValueTree } from './CoachProgressScreen';
import { coachRange } from './coach-calendar';
import { useCoachUpload } from './useCoachUpload';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { createApiClient } from '../../data/api-client';
import { useCoachSaveGuard } from './useCoachSaveGuard';

export function CoachClientHealthScreen({ clientId, mode }: { clientId: string; mode: 'wellness' | 'photos' | 'measures' }) {
  if (mode === 'photos') return <CoachPhotos key={clientId} clientId={clientId} />;
  if (mode === 'measures') return <CoachMeasures key={clientId} clientId={clientId} />;
  return <CoachWellness key={clientId} clientId={clientId} />;
}
function CoachWellness({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState(coachRange().from.slice(0, 10));
  const [to, setTo] = useState(coachRange().to.slice(0, 10));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;
  const query = useCoachQuery<ClientWellnessResponse>(
    valid ? '/clients/' + clientId + '/wellness?' + new URLSearchParams({ dateFrom: from, dateTo: to }) : null,
  );
  return (
    <CoachPage title={t('coachWorkspace.wellness')}>
      <CoachField label={t('coachWorkspace.from')} value={from} onChange={setFrom} />
      <CoachField label={t('coachWorkspace.to')} value={to} onChange={setTo} />
      <CoachStatus query={query} />
      <CoachValueTree value={query.data?.summary} />
      {query.data?.weeklyReports.map((report) => (
        <View style={ui.card} key={report.id}>
          <Text style={ui.label}>{report.weekStartDate}</Text>
          <CoachValueTree value={report} />
        </View>
      ))}
      {query.data?.sessions.map((session) => (
        <View style={ui.card} key={session.id}>
          <Text style={ui.label}>
            {session.planDayTitle}
            {' · '}
            {session.sessionDate}
          </Text>
          <CoachValueTree value={session} />
        </View>
      ))}
    </CoachPage>
  );
}
function CoachMeasures({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const query = useCoachQuery<ClientView>('/clients/' + clientId);
  const [revision, setRevision] = useState(0);
  return (
    <CoachPage title={t('coachWorkspace.measures')}>
      <CoachStatus query={query} />
      {query.data ? (
        <MeasuresEditor
          key={revision}
          client={query.data}
          onReload={async () => {
            await query.refetch();
            setRevision((value) => value + 1);
          }}
        />
      ) : null}
    </CoachPage>
  );
}
function MeasuresEditor({ client, onReload }: { client: ClientView; onReload: () => Promise<void> }) {
  const { t } = useTranslation();
  const write = useCoachWrite();
  const auth = useCoachAuth();
  const guard = useCoachSaveGuard();
  const draft = useCoachDraft(
    'measures:' + client.id,
    {
      weightKg: client.weightKg,
      heightCm: client.heightCm,
      waistCm: client.waistCm,
      hipCm: client.hipCm,
      fcMax: client.fcMax,
      fcRest: client.fcRest,
    },
    client.updatedAt,
  );
  return (
    <View style={ui.card}>
      <CoachConflict conflict={draft.conflict || guard.conflict} onDiscard={() => void draft.clear().then(onReload)} />
      {Object.entries(draft.value).map(([key, value]) => (
        <CoachField
          key={key}
          label={t('coachWorkspace.field.' + key)}
          value={String(value ?? '')}
          onChange={(next) =>
            draft.setValue((old) => ({ ...old, [key]: next === '' ? null : Number(next.replace(',', '.')) }))
          }
          numeric
        />
      ))}
      <CoachButton
        label={t('coachWorkspace.save')}
        disabled={
          !draft.ready ||
          draft.conflict ||
          guard.conflict ||
          Object.values(draft.value).some((value) => value != null && (!Number.isFinite(value) || value <= 0))
        }
        loading={write.isPending || guard.busy}
        onPress={() =>
          void guard.run(
            client.updatedAt,
            async () => (await createApiClient(auth).get<ClientView>('/clients/' + client.id)).updatedAt,
            async () => {
              await write.mutateAsync({ path: '/clients/' + client.id, method: 'PATCH', body: draft.value });
              await draft.clear();
            },
          )
        }
      />
    </View>
  );
}
function CoachPhotos({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('active');
  const query = useCoachQuery<{ items: ClientProgressPhoto[] }>('/clients/' + clientId + '/progress-photos');
  const write = useCoachWrite();
  const upload = useCoachUpload<ClientProgressPhoto>('/clients/' + clientId + '/progress-photos/upload');
  const photos = (query.data?.items ?? []).filter(
    (photo) => filter === 'all' || Boolean(photo.archived) === (filter === 'archived'),
  );
  return (
    <CoachPage title={t('coachWorkspace.photos')}>
      <CoachSelect
        label={t('coachWorkspace.status')}
        value={filter}
        onChange={setFilter}
        options={['active', 'archived', 'all'].map((value) => ({ value, label: t('coachWorkspace.' + value) }))}
      />
      <CoachButton
        label={t('coachWorkspace.upload')}
        loading={upload.isPending}
        onPress={() =>
          void upload
            .mutateAsync()
            .then((result) => {
              if (result) void query.refetch();
            })
            .catch(() => undefined)
        }
      />
      <CoachStatus query={query} empty={photos.length === 0} />
      {photos.map((photo) => (
        <View key={photo.id} style={ui.card}>
          <Image source={{ uri: photo.imageUrl }} accessibilityLabel={t('coachWorkspace.photos')} style={photoStyle} />
          <Text style={ui.muted}>{new Date(photo.createdAt).toLocaleDateString()}</Text>
          <CoachButton
            label={t(photo.archived ? 'coachWorkspace.restore' : 'coachWorkspace.archive')}
            disabled={write.isPending}
            onPress={() =>
              write.mutate({
                path: `/clients/${clientId}/progress-photos/${photo.id}`,
                method: 'PATCH',
                body: { archived: !photo.archived },
              })
            }
          />
          <CoachButton
            label={t('coachWorkspace.delete')}
            disabled={write.isPending}
            danger
            onPress={() =>
              confirmCoachDelete(
                t('coachWorkspace.photos'),
                () => write.mutate({ path: `/clients/${clientId}/progress-photos/${photo.id}`, method: 'DELETE' }),
                t,
              )
            }
          />
        </View>
      ))}
    </CoachPage>
  );
}
const photoStyle = { width: '100%' as const, height: 260, borderRadius: 16 };
