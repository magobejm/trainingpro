import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Select, TextField } from '@trainerpro/ui';
import type { ProgressExerciseRef, ProgressRoutine } from '@trainerpro/shared';
import { useProgressExercises, useProgressRoutines } from '../../../data/hooks/useProgressDashboard';
import { QueryResult } from '../../../components/AsyncStatus';
import { matchesSearch } from '../../../utils/normalize-search';
import { dashboardStyles as styles } from './dashboard.styles';
import { DashboardPager, DashboardRange } from './DashboardFilters';
import type { DateRange } from './progress-screen.types';
import { ConsistencyHeatmap } from './ConsistencyHeatmap';
import { AdherenceSummary } from './AdherenceSummary';
import { heatmapRange } from './heatmap';

export const categories = ['strength', 'cardio', 'plio', 'isometric', 'mobility', 'sport'] as const;
export function DashboardHome(props: {
  clientId: string;
  range: DateRange;
  onRange: (range: DateRange) => void;
  onRoutine: (id: string) => void;
  onExercise: (exercise: ProgressExerciseRef) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const query = useProgressRoutines(props.clientId);
  const summaryRange = heatmapRange(new Date());
  return (
    <View style={styles.column}>
      <ConsistencyHeatmap clientId={props.clientId} t={t} />
      <AdherenceSummary clientId={props.clientId} {...summaryRange} t={t} />
      <RoutineCatalog routines={query.data?.routines ?? []} onSelect={props.onRoutine} />
      <QueryResult
        {...query}
        emptyTitle={t('progressDashboard.emptyRoutines')}
        itemCount={query.data?.routines.length ?? 0}
        onRetry={() => void query.refetch()}
      />
      <View style={styles.panel}>
        <Text style={styles.heading}>{t('progressDashboard.universal')}</Text>
        <DashboardRange range={props.range} onChange={props.onRange} historyFrom={query.data?.historyFrom} />
        <UniversalExercises clientId={props.clientId} range={props.range} onSelect={props.onExercise} />
      </View>
    </View>
  );
}

function RoutineCatalog(props: { routines: ProgressRoutine[]; onSelect: (id: string) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(0);
  const years = [
    ...new Set(
      props.routines.flatMap((routine) => {
        const from = Number(routine.from.slice(0, 4));
        const to = Number((routine.to ?? new Date().toISOString()).slice(0, 4));
        return Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => String(from + i));
      }),
    ),
  ]
    .sort()
    .reverse();
  const found = props.routines.filter(
    (r) =>
      matchesSearch(r.name, search) && (year === 'all' || (r.from <= `${year}-12-31` && (!r.to || r.to >= `${year}-01-01`))),
  );
  return (
    <View style={styles.column}>
      <Text style={styles.heading}>{t('progressDashboard.routines')}</Text>
      <View style={styles.row}>
        <TextField
          containerStyle={styles.field}
          label={t('progressDashboard.searchRoutines')}
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setPage(0);
          }}
        />
        <Select
          containerStyle={styles.field}
          label={t('progressDashboard.years')}
          value={year}
          onChange={(value) => {
            setYear(value);
            setPage(0);
          }}
          options={[
            { value: 'all', label: t('progressDashboard.allYears') },
            ...years.map((value) => ({ value, label: value })),
          ]}
        />
      </View>
      <View style={styles.grid}>
        {found.slice(page * 15, page * 15 + 15).map((routine) => (
          <Pressable
            key={routine.assignmentId}
            accessibilityRole="button"
            accessibilityLabel={routine.name}
            onPress={() => props.onSelect(routine.assignmentId)}
            style={[styles.panel, styles.tile]}
          >
            <Text style={routine.active ? styles.active : styles.muted}>
              {t(`progressDashboard.${routine.active ? 'active' : 'past'}`)}
            </Text>
            <Text style={styles.heading}>{routine.name}</Text>
            <Text
              style={styles.muted}
            >{`${routine.from} — ${routine.to ?? t(`progressDashboard.${routine.active ? 'ongoing' : 'unknownEnd'}`)}`}</Text>
            <Text style={styles.muted}>{t('progressDashboard.frequency', { count: routine.frequency })}</Text>
          </Pressable>
        ))}
      </View>
      {!found.length && props.routines.length ? (
        <Text style={styles.muted}>{t('progressDashboard.emptyRoutines')}</Text>
      ) : null}
      <DashboardPager page={page} count={found.length} size={15} onChange={setPage} />
    </View>
  );
}

function UniversalExercises(props: {
  clientId: string;
  range: DateRange;
  onSelect: (exercise: ProgressExerciseRef) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const query = useProgressExercises(props.clientId, props.range, true);
  const found = useMemo(
    () =>
      (query.data ?? []).filter(
        (exercise) => matchesSearch(exercise.name, search) && (category === 'all' || exercise.exerciseType === category),
      ),
    [query.data, search, category],
  );
  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <TextField
          containerStyle={styles.field}
          label={t('progressDashboard.searchExercises')}
          value={search}
          onChangeText={setSearch}
        />
        <Select
          containerStyle={styles.field}
          label={t('progressDashboard.category')}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: t('progressDashboard.allCategories') },
            ...categories.map((value) => ({ value, label: t(`coach.progress.filter.group.${value}`) })),
          ]}
        />
      </View>
      <QueryResult
        {...query}
        emptyTitle={t('progressDashboard.emptyExercises')}
        itemCount={found.length}
        onRetry={() => void query.refetch()}
      />
      <View style={styles.grid}>
        {found.map((exercise) => (
          <Pressable
            key={`${exercise.exerciseType}:${exercise.exerciseId}`}
            accessibilityRole="button"
            accessibilityLabel={exercise.name}
            onPress={() => props.onSelect(exercise)}
            style={[styles.panel, styles.tile]}
          >
            <Text style={styles.text}>{exercise.name}</Text>
            <Text style={styles.muted}>{t(`coach.progress.filter.group.${exercise.exerciseType}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
