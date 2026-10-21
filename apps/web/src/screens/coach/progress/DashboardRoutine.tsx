import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Select } from '@trainerpro/ui';
import type { ProgressExerciseRef, ProgressRoutineCycle, ProgressRoutine, ProgressRoutineDetail } from '@trainerpro/shared';
import { useProgressRoutine } from '../../../data/hooks/useProgressDashboard';
import { QueryResult } from '../../../components/AsyncStatus';
import { dashboardStyles as styles } from './dashboard.styles';
import { DashboardPager } from './DashboardFilters';
import { DashboardChart, routineMetrics, type DashboardMetric } from './DashboardChart';
import { DashboardDetail } from './DashboardDetail';
import { cycleChartPoints, selectedAdherence, formatMetric } from './dashboard-model';
import { DashboardPdf } from './DashboardPdf';

type DashboardRoutineProps = {
  clientId: string;
  clientName: string;
  assignmentId: string;
  selected: number[];
  compare: boolean;
  visible?: boolean;
  onSelection: (selected: number[], compare: boolean) => void;
  onBack: () => void;
  onExercise: (exercise: ProgressExerciseRef) => void;
};

export function DashboardRoutine(props: DashboardRoutineProps): React.JSX.Element {
  const { t } = useTranslation();
  const query = useProgressRoutine(props.clientId, props.assignmentId);
  const [detail, setDetail] = useState<DashboardMetric | null>(null);
  const routine = query.data?.routine;
  const cycles = query.data?.cycles ?? [];
  const points = cycleChartPoints(cycles, props.selected, props.compare);
  const adherence = selectedAdherence(cycles, props.selected);
  const cycleDays = routine?.cycleDays ?? 7;
  return (
    <View style={styles.column}>
      <Button label={t('progressDashboard.backRoutines')} onPress={props.onBack} variant="secondary" />
      <QueryResult
        {...query}
        emptyTitle={t('progressDashboard.noData')}
        itemCount={routine ? 1 : 0}
        onRetry={() => void query.refetch()}
      />
      {routine ? (
        <>
          <RoutineHeader routine={routine} />
          <CycleSelector cycles={cycles} cycleDays={cycleDays} selected={props.selected} onSelection={props.onSelection} />
          {props.selected.length ? (
            <>
              <View style={styles.panel}>
                <Text
                  style={styles.heading}
                >{`${t('progressDashboard.adherence')} · ${formatMetric(adherence.percent, '%')}`}</Text>
                <Text style={styles.text}>{t('progressDashboard.adherenceDetail', adherence)}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.min(100, adherence.percent ?? 0)}%` }]} />
                </View>
                <Text style={styles.muted}>{t('progressDashboard.adherenceToday')}</Text>
              </View>
              <DashboardPdf
                clientName={props.clientName}
                title={routine.name}
                points={points}
                metrics={routineMetrics}
                context={[
                  t('progressDashboard.selectedCount', { count: props.selected.length }),
                  t('progressDashboard.adherenceDetail', adherence),
                ]}
              />
              <View style={styles.grid}>
                {(props.visible === false ? [] : routineMetrics).map((metric) => (
                  <DashboardChart
                    key={metric.key}
                    metric={metric}
                    points={points}
                    onDetail={() => setDetail(metric)}
                    compare={props.compare}
                    cycleDays={cycleDays}
                  />
                ))}
              </View>
              <Select
                value={''}
                label={t('progressDashboard.auditExercise')}
                placeholder={t('progressDashboard.selectExercise')}
                options={(query.data?.exercises ?? []).map((exercise) => ({
                  value: `${exercise.exerciseType}:${exercise.exerciseId}`,
                  label: exercise.name,
                }))}
                onChange={(value) => {
                  const exercise = query.data?.exercises.find((e) => `${e.exerciseType}:${e.exerciseId}` === value);
                  if (exercise) props.onExercise(exercise);
                }}
              />
              <Button
                label={t('progressDashboard.outline')}
                onPress={() => props.onSelection([], false)}
                variant="secondary"
              />
            </>
          ) : (
            <RoutineOutline days={query.data?.days ?? []} onExercise={props.onExercise} />
          )}
        </>
      ) : null}
      {detail && props.visible !== false ? (
        <DashboardDetail
          key={detail.key}
          metric={detail}
          points={points}
          compare={props.compare}
          cycleDays={cycleDays}
          title={routine?.name ?? ''}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </View>
  );
}

function RoutineHeader({ routine }: { routine: ProgressRoutine }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.panel}>
      <View style={styles.between}>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={routine.active ? styles.active : styles.muted}>
          {t(`progressDashboard.${routine.active ? 'active' : 'past'}`)}
        </Text>
      </View>
      <Text
        style={styles.muted}
      >{`${routine.from} — ${routine.to ?? t(`progressDashboard.${routine.active ? 'ongoing' : 'unknownEnd'}`)}`}</Text>
      <Text style={styles.muted}>
        {`${t('progressDashboard.objectives')}: ${routine.objectives.join(', ') || t('progressDashboard.noObjective')}`}
      </Text>
      <Text style={styles.muted}>{t('progressDashboard.cycleDays', { count: routine.cycleDays })}</Text>
    </View>
  );
}

function RoutineOutline(props: {
  days: ProgressRoutineDetail['days'];
  onExercise: (exercise: ProgressExerciseRef) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.column}>
      {props.days.map((day) => (
        <View key={day.dayIndex} style={styles.panel}>
          <Text style={styles.heading}>{day.title || t('progressDashboard.day', { count: day.dayIndex })}</Text>
          {day.exercises.map((exercise, index) => (
            <Pressable
              key={`${exercise.exerciseType}:${exercise.exerciseId}:${index}`}
              accessibilityRole="button"
              accessibilityLabel={exercise.name}
              onPress={() => props.onExercise(exercise)}
              style={styles.between}
            >
              <Text style={styles.text}>{exercise.name}</Text>
              <Text style={styles.muted}>{t(`coach.progress.filter.group.${exercise.exerciseType}`)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

export function CycleSelector(props: {
  cycles: ProgressRoutineCycle[];
  cycleDays: number;
  selected: number[];
  onSelection: (selected: number[], compare: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<number[] | null>(null);
  const [page, setPage] = useState(0);
  const label = props.cycleDays === 7 ? 'week' : 'cycle';
  return (
    <View style={[styles.panel, draft ? styles.selected : null]}>
      <View style={styles.between}>
        <Text style={styles.heading}>{t(`progressDashboard.${props.cycleDays === 7 ? 'cycles' : 'otherCycles'}`)}</Text>
        <Button
          label={t(`progressDashboard.${props.cycleDays === 7 ? 'compare' : 'compareCycles'}`)}
          disabled={!props.cycles.length}
          onPress={() => setDraft([...props.selected])}
          variant="secondary"
          size="sm"
        />
      </View>
      {!props.cycles.length ? <Text style={styles.muted}>{t('progressDashboard.emptyCycles')}</Text> : null}
      <View style={styles.grid}>
        {props.cycles.slice(page * 48, page * 48 + 48).map((cycle) => {
          const selected = (draft ?? props.selected).includes(cycle.index);
          return (
            <Pressable
              key={cycle.index}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`progressDashboard.${label}`, { count: cycle.index + 1 })}
              style={[styles.panel, styles.cycle, selected ? styles.selected : null]}
              onPress={() => {
                if (draft !== null) setDraft(selected ? draft.filter((id) => id !== cycle.index) : [...draft, cycle.index]);
                else props.onSelection([cycle.index], false);
              }}
            >
              <Text style={styles.text}>{t(`progressDashboard.${label}`, { count: cycle.index + 1 })}</Text>
              <Text style={styles.muted}>{`${cycle.from} — ${cycle.to}`}</Text>
            </Pressable>
          );
        })}
      </View>
      <DashboardPager page={page} count={props.cycles.length} size={48} onChange={setPage} />
      {draft !== null ? (
        <View style={styles.row}>
          <Button
            label={t('progressDashboard.selectAll')}
            onPress={() => setDraft(props.cycles.map((c) => c.index))}
            variant="secondary"
          />
          <Button
            label={t('progressDashboard.confirm')}
            disabled={!draft.length}
            onPress={() => {
              props.onSelection(
                [...draft].sort((a, b) => a - b),
                true,
              );
              setDraft(null);
            }}
          />
          <Button label={t('progressDashboard.cancel')} onPress={() => setDraft(null)} variant="ghost" />
        </View>
      ) : null}
    </View>
  );
}
