import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@trainerpro/ui';
import type { ProgressExerciseRef, ProgressRoutineDetail } from '@trainerpro/shared';
import { useProgressDaily, useProgressRoutines } from '../../../data/hooks/useProgressDashboard';
import { QueryResult } from '../../../components/AsyncStatus';
import { dashboardStyles as styles } from './dashboard.styles';
import { exerciseMetrics, type DashboardMetric } from './DashboardChart';
import { DashboardDetail } from './DashboardDetail';
import { DashboardRange } from './DashboardFilters';
import { CycleSelector } from './DashboardRoutine';
import { DashboardExerciseResults } from './DashboardExerciseResults';
import { defaultRange, exerciseKpis, type DashboardPoint } from './dashboard-model';
import type { DateRange } from './progress-screen.types';

export function DashboardExercise(props: {
  clientId: string;
  clientName: string;
  exercise: ProgressExerciseRef;
  range: DateRange;
  routine?: ProgressRoutineDetail;
  selected: number[];
  onSelection: (selected: number[]) => void;
  onRange: (range: DateRange) => void;
  onBack: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const catalog = useProgressRoutines(props.clientId);
  const [active, setActive] = useState<string[]>([]);
  const [detail, setDetail] = useState<DashboardMetric | null>(null);
  const range = props.routine
    ? { from: props.routine.routine.from, to: props.routine.routine.to ?? defaultRange().to }
    : props.range;
  const query = useProgressDaily({
    clientId: props.clientId,
    exercise: props.exercise,
    range,
    assignmentId: props.routine?.routine.assignmentId ?? null,
    cycles: props.routine ? props.selected : [],
  });
  const data = query.data;
  const points: DashboardPoint[] = (data?.points ?? []).map((point) => ({ ...point }));
  const metrics = exerciseMetrics(props.exercise.exerciseType, data?.points ?? []);
  const visible = metrics.filter((m) => active.includes(m.key));
  const scope = `${range.from}:${range.to}:${props.selected.join(',')}`;
  useEffect(() => setDetail(null), [scope]);
  const kpis = exerciseKpis(data?.kpis, props.exercise.exerciseType, t('progressDashboard.notApplicable'));
  const toggle = (key: string) =>
    setActive((current) => (current.includes(key) ? current.filter((id) => id !== key) : [...current, key]));
  return (
    <View style={styles.column}>
      <Button
        label={t(`progressDashboard.${props.routine ? 'backRoutine' : 'backHistory'}`)}
        onPress={props.onBack}
        variant="secondary"
      />
      <View style={styles.panel}>
        <Text style={styles.title}>{props.exercise.name}</Text>
        <Text style={styles.muted}>{t(`coach.progress.filter.group.${props.exercise.exerciseType}`)}</Text>
        <Text style={styles.muted}>{t(`progressDashboard.${props.routine ? 'routineScope' : 'globalScope'}`)}</Text>
        {props.routine ? (
          <CycleSelector
            cycles={props.routine.cycles}
            cycleDays={props.routine.routine.cycleDays}
            selected={props.selected}
            onSelection={(selected) => props.onSelection(selected)}
          />
        ) : (
          <DashboardRange range={props.range} onChange={props.onRange} historyFrom={catalog.data?.historyFrom} />
        )}
      </View>
      <QueryResult
        {...query}
        emptyTitle={t('progressDashboard.noData')}
        itemCount={data?.points.length ?? 0}
        onRetry={() => void query.refetch()}
      />
      {data ? (
        <DashboardExerciseResults
          kpis={kpis}
          metrics={metrics}
          active={active}
          visible={visible}
          points={points}
          clientName={props.clientName}
          title={props.exercise.name}
          onToggle={toggle}
          onDetail={setDetail}
          context={[
            `${range.from} — ${range.to}`,
            ...kpis.map((k) => `${t(`progressDashboard.${k.key}`)}: ${k.value}`),
            ...(props.routine
              ? [
                  props.routine.routine.name,
                  t('progressDashboard.selectedCount', { count: props.selected.length || props.routine.cycles.length }),
                ]
              : []),
          ]}
        />
      ) : null}
      {detail ? (
        <DashboardDetail
          key={`${detail.key}:${scope}`}
          metric={detail}
          title={props.exercise.name}
          points={points}
          daily={data?.points}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </View>
  );
}
