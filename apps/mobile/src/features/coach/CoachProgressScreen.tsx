import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { ProgressRecordsResponse, SessionView } from '@trainerpro/shared';
import { BarsChart } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { CoachButton, CoachField, CoachPage, CoachSelect, CoachStatus, ui } from './CoachUi';
import { coachRange, isCoachDate } from './coach-calendar';
import { coachProgressParams } from './coach-progress-query';
import { CoachPdfButton } from './CoachPdfButton';
type Overview = {
  strengthWeekly: {
    weekStart: string;
    volumeKg: number;
    maxWeightKg: number | null;
    totalSets: number;
    totalReps: number;
    muscleGroup: string;
  }[];
  cardioWeekly: { weekStart: string; totalDurationSeconds: number; totalDistanceMeters: number; methodType: string }[];
  srpeWeekly: { weekStart: string; totalSrpe: number }[];
};
type Session = {
  sessionId: string;
  sessionDate: string;
  exerciseCount: number;
  totalTonnage: number;
  durationMinutes?: number;
  avgRpe?: number;
};
export function CoachProgressScreen({ clientId, mode = 'progress' }: { clientId: string; mode?: string }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState(coachRange().from.slice(0, 10));
  const [to, setTo] = useState(coachRange().to.slice(0, 10));
  const [sessionId, setSessionId] = useState('');
  const params = coachProgressParams(clientId, from, to);
  const valid = isCoachDate(from) && isCoachDate(to) && from <= to;
  const overview = useCoachQuery<Overview>(valid ? '/progress/overview?' + params : null);
  const sessions = useCoachQuery<Session[]>(valid ? '/progress/sessions?' + params + '&limit=100' : null);
  const records = useCoachQuery<ProgressRecordsResponse>(valid ? '/progress/records?' + params : null);
  if (sessionId) return <CoachSessionView sessionId={sessionId} onBack={() => setSessionId('')} />;
  const strength = overview.data?.strengthWeekly ?? [];
  const cardio = overview.data?.cardioWeekly ?? [];
  const totalVolume = strength.reduce((sum, row) => sum + row.volumeKg, 0);
  const totalSets = strength.reduce((sum, row) => sum + row.totalSets, 0);
  const totalMinutes = cardio.reduce((sum, row) => sum + row.totalDurationSeconds / 60, 0);
  return (
    <CoachPage title={t('coachWorkspace.' + mode)}>
      <CoachField label={t('coachWorkspace.from')} value={from} onChange={setFrom} />
      <CoachField label={t('coachWorkspace.to')} value={to} onChange={setTo} />
      {!valid ? <Text style={ui.error}>{t('coachWorkspace.invalidDates')}</Text> : null}
      <CoachStatus query={overview} />
      <View style={ui.row}>
        {[
          [t('coachWorkspace.volumeKg'), totalVolume],
          [t('coachWorkspace.sets'), totalSets],
          [t('coachWorkspace.minutes'), Math.round(totalMinutes)],
        ].map(([label, value]) => (
          <View key={label} style={ui.card}>
            <Text style={ui.muted}>{label}</Text>
            <Text style={ui.title}>{value}</Text>
          </View>
        ))}
      </View>
      <ProgressCharts data={overview.data} />
      {(records.data?.records ?? []).map((record) => (
        <View key={record.exerciseId + record.sessionDate} style={ui.card}>
          <Text style={ui.label}>{record.exerciseName}</Text>
          <Text style={ui.title}>
            {record.e1rm.toFixed(1)}
            {' kg'}
          </Text>
          {record.previousBest && record.previousBest > 0 ? (
            <Text style={ui.text}>
              {t('coachWorkspace.improvement', { percent: ((record.e1rm / record.previousBest - 1) * 100).toFixed(1) })}
            </Text>
          ) : null}
        </View>
      ))}
      <CoachStatus query={records} />
      <CoachStatus query={sessions} empty={sessions.data?.length === 0} />
      {(sessions.data ?? []).map((session) => (
        <View style={ui.card} key={session.sessionId}>
          <Text style={ui.label}>{new Date(session.sessionDate).toLocaleDateString()}</Text>
          <Text style={ui.text}>
            {session.exerciseCount} {t('coachWorkspace.exercises')}
            {' · '}
            {session.totalTonnage}
            {' kg ·'} {session.durationMinutes ?? '—'}
            {' min '}
          </Text>
          <CoachButton label={t('coachWorkspace.open')} onPress={() => setSessionId(session.sessionId)} />
        </View>
      ))}
      <CoachPdfButton
        title={t('coachWorkspace.progress')}
        sections={[
          {
            title: from + ' — ' + to,
            lines: [t('coachWorkspace.volumeKg') + ': ' + totalVolume, t('coachWorkspace.sets') + ': ' + totalSets],
          },
          {
            title: t('coachWorkspace.records'),
            lines: (records.data?.records ?? []).map(
              (record) => record.exerciseName + ': ' + record.e1rm.toFixed(1) + ' kg',
            ),
          },
        ]}
      />
      <AdvancedProgress clientId={clientId} from={from} to={to} valid={valid} />
    </CoachPage>
  );
}
function ProgressCharts({ data }: { data?: Overview }) {
  const { t } = useTranslation();
  return (
    <View style={ui.field}>
      {data ? (
        <>
          <BarsChart
            title={t('coachWorkspace.volumeKg')}
            emptyLabel={t('coachWorkspace.empty')}
            bars={data.strengthWeekly.map((row, i) => ({
              id: row.weekStart + ':' + i,
              label: row.weekStart.slice(5, 10),
              value: row.volumeKg,
            }))}
          />
          <BarsChart
            title={t('coachWorkspace.minutes')}
            emptyLabel={t('coachWorkspace.empty')}
            bars={data.cardioWeekly.map((row, i) => ({
              id: row.weekStart + ':' + i,
              label: row.weekStart.slice(5, 10),
              value: row.totalDurationSeconds / 60,
            }))}
          />
          <BarsChart
            title={t('coachWorkspace.trainingLoad')}
            emptyLabel={t('coachWorkspace.empty')}
            bars={data.srpeWeekly.map((row) => ({
              id: row.weekStart,
              label: row.weekStart.slice(5, 10),
              value: row.totalSrpe,
            }))}
          />
        </>
      ) : null}
    </View>
  );
}
function AdvancedProgress({ clientId, from, to, valid }: { clientId: string; from: string; to: string; valid: boolean }) {
  const { t } = useTranslation();
  const [exercise, setExercise] = useState('');
  const [template, setTemplate] = useState('');
  const [category, setCategory] = useState('strength');
  const params = coachProgressParams(clientId, from, to);
  const exercises = useCoachQuery<Record<string, { id: string; name: string }[]>>(
    valid ? '/progress/performed-exercises?' + params : null,
  );
  const templates = useCoachQuery<{ templates: { id: string; name: string }[] }>(
    valid ? '/progress/performed-templates?' + params : null,
  );
  const progress = useCoachQuery<Record<string, unknown>[]>(
    valid && exercise
      ? '/progress/exercise?' + params + '&exerciseId=' + encodeURIComponent(exercise) + '&exerciseType=' + category
      : null,
  );
  const microcycle = useCoachQuery<Record<string, unknown>>(
    valid && template
      ? '/progress/microcycle?' + params + '&templateId=' + encodeURIComponent(template) + '&category=' + category
      : null,
  );
  return (
    <View style={ui.card}>
      <CoachStatus query={exercises} />
      <CoachSelect
        label={t('coachWorkspace.chooseExercise')}
        value={exercise}
        onChange={setExercise}
        options={[
          { value: '', label: '—' },
          ...(exercises.data?.[category] ?? []).map((item) => ({ value: item.id, label: item.name })),
        ]}
      />
      <CoachSelect
        label={t('coachWorkspace.category')}
        value={category}
        onChange={setCategory}
        options={['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'].map((value) => ({
          value,
          label: t('coachWorkspace.block.' + value),
        }))}
      />
      {exercise ? (
        <>
          <CoachStatus query={progress} />
          <CoachValueTree value={progress.data} />
        </>
      ) : null}
      <CoachStatus query={templates} />
      <CoachSelect
        label={t('coachWorkspace.routines')}
        value={template}
        onChange={setTemplate}
        options={[
          { value: '', label: '—' },
          ...(templates.data?.templates ?? []).map((item) => ({ value: item.id, label: item.name })),
        ]}
      />
      {template ? (
        <>
          <CoachStatus query={microcycle} />
          <CoachValueTree value={microcycle.data} />
        </>
      ) : null}
    </View>
  );
}
export function CoachSessionView({ sessionId, onBack }: { sessionId: string; onBack?: () => void }) {
  const { t } = useTranslation();
  const query = useCoachQuery<SessionView>('/sessions/' + sessionId);
  return (
    <CoachPage title={t('coachWorkspace.sessions')} onBack={onBack}>
      <CoachStatus query={query} />
      {query.data ? (
        <>
          <Text style={ui.label}>
            {query.data.sessionDate}
            {' · '}
            {query.data.status}
          </Text>
          {query.data.items.map((item) => (
            <View key={item.id} style={ui.card}>
              <Text style={ui.label}>{item.displayName}</Text>
              <CoachValueTree value={item} />
            </View>
          ))}
        </>
      ) : null}
    </CoachPage>
  );
}
const hiddenFields =
  /(^id$|Id$|Ids$|subject|organization|membership|storagePath|publicUrl|imageUrl|sortOrder|fieldModes|lockedFields|metadataJson|perSetWeightRangesJson|classificationColor|^kind$|^type$)/i;
export function CoachValueTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const { t } = useTranslation();
  if (value == null || depth > 5) return null;
  if (typeof value !== 'object') return <Text style={ui.text}>{String(value)}</Text>;
  return (
    <View style={ui.field}>
      {Object.entries(value)
        .filter(([key, entry]) => !hiddenFields.test(key) && entry != null && key !== 'displayName')
        .map(([key, entry]) => (
          <View key={key} style={depth < 2 ? ui.card : ui.field}>
            {!/^\d+$/.test(key) ? (
              <Text style={ui.muted}>
                {t('coachWorkspace.field.' + key, { defaultValue: key.replace(/([A-Z])/g, ' $1') })}
              </Text>
            ) : null}
            {typeof entry === 'object' ? (
              <CoachValueTree value={entry} depth={depth + 1} />
            ) : (
              <Text style={ui.text}>
                {typeof entry === 'boolean' ? t(entry ? 'coachWorkspace.yes' : 'coachWorkspace.no') : String(entry)}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}
