import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { BarsChart } from '@trainerpro/ui';
import type { ProgressRecordsResponse } from '@trainerpro/shared';
import { createApiClient, type ActiveRole } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import { LIGHT } from '../../theme/light';
import { formatSummaryKg } from './workout-summary';
import { flattenExercises } from './records-view';

type ExerciseType = 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
type Performed = Record<ExerciseType, Array<{ id: string; name: string }>>;
const MAX_BARS = 6;

function formatBarLabel(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

type ExercisePoint = { e1rm: number | null; sessionDate: string };

export function ClientRecordsPanel(props: { t: TFunction }): React.JSX.Element {
  const range = useMemo(() => yearRange(), []);
  const records = useProgressGet<ProgressRecordsResponse>('/progress/records', range);
  const performed = useProgressGet<Performed>('/progress/performed-exercises', range);
  const options = useMemo(() => flattenExercises(performed.data), [performed.data]);
  const [selected, setSelected] = useState<string | null>(null);
  const exercise = options.find((option) => option.id === selected) ?? options[0] ?? null;
  const points = useExercisePoints(exercise, range);
  return (
    <View style={{ gap: 12, width: '100%' }}>
      <RecordList records={records.data?.records ?? []} t={props.t} />
      <ExercisePicker onSelect={setSelected} options={options} selectedId={exercise?.id ?? null} />
      <BarsChart
        bars={points.slice(-MAX_BARS).map((point) => ({
          id: point.sessionDate,
          label: formatBarLabel(point.sessionDate),
          value: point.e1rm ?? 0,
        }))}
        emptyLabel={props.t('client.progress.empty')}
        title={props.t('client.progress.e1rmChart')}
      />
    </View>
  );
}

function latestPerExercise(records: ProgressRecordsResponse['records']): ProgressRecordsResponse['records'] {
  const latest = new Map<string, ProgressRecordsResponse['records'][number]>();
  for (const record of records) {
    const current = latest.get(record.exerciseId);
    const newer =
      !current ||
      record.sessionDate > current.sessionDate ||
      (record.sessionDate === current.sessionDate && record.e1rm > current.e1rm);
    if (newer) latest.set(record.exerciseId, record);
  }
  return [...latest.values()].sort((left, right) => right.sessionDate.localeCompare(left.sessionDate));
}

function RecordList(props: { records: ProgressRecordsResponse['records']; t: TFunction }): React.JSX.Element {
  const records = latestPerExercise(props.records);
  if (records.length === 0) return <Text style={{ color: LIGHT.textMuted }}>{props.t('client.progress.recordsEmpty')}</Text>;
  return (
    <View style={{ gap: 8 }}>
      {records.map((record) => (
        <View
          key={record.exerciseId}
          style={{
            alignItems: 'center',
            backgroundColor: LIGHT.bgCard,
            borderColor: LIGHT.border,
            borderRadius: LIGHT.radiusMd,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 12,
            padding: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Text numberOfLines={2} style={{ color: LIGHT.textStrong, fontSize: 15, fontWeight: '700' }}>
              {record.exerciseName}
            </Text>
            <Text style={{ color: LIGHT.textMuted, fontSize: 12 }}>{record.sessionDate}</Text>
          </View>
          <Text style={{ color: LIGHT.accentDark, fontSize: 18, fontWeight: '800' }}>
            {props.t('client.progress.recordValue', { e1rm: formatSummaryKg(record.e1rm) })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ExercisePicker(props: {
  onSelect: (id: string) => void;
  options: Array<{ id: string; name: string; type: ExerciseType }>;
  selectedId: string | null;
}): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {props.options.map((option) => (
        <Pressable
          accessibilityRole={'button'}
          key={`${option.type}:${option.id}`}
          onPress={() => props.onSelect(option.id)}
          style={{
            backgroundColor: option.id === props.selectedId ? LIGHT.accentSoft : LIGHT.bgCard,
            borderRadius: LIGHT.radiusFull,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: LIGHT.textStrong, fontWeight: '700' }}>{option.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function useExercisePoints(
  exercise: { id: string; type: ExerciseType } | null,
  range: { from: string; to: string },
): ExercisePoint[] {
  const query = useProgressGet<ExercisePoint[]>(
    exercise ? `/progress/exercise?exerciseId=${exercise.id}&exerciseType=${exercise.type}` : null,
    range,
  );
  return (query.data ?? []).filter((point) => point.e1rm != null);
}

function useProgressGet<T>(path: string | null, range: { from: string; to: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return useQuery({
    enabled: Boolean(path && accessToken && activeRole),
    queryFn: () => fetchProgress<T>(accessToken ?? '', activeRole ?? 'client', path ?? '', range),
    queryKey: ['progress', path, range.from, range.to, activeRole],
  });
}

function fetchProgress<T>(
  accessToken: string,
  activeRole: ActiveRole,
  path: string,
  range: { from: string; to: string },
): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  return createApiClient({ accessToken, activeRole }).get<T>(`${path}${separator}from=${range.from}&to=${range.to}`);
}

function yearRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 365);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
