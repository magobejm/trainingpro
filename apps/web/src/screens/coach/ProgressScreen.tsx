import { EmptyIllustration } from '../../components/EmptyIllustrations';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useProgressRouteClient, useProgressSelection } from './progress/useProgressListState';
import { useExerciseProgressQuery } from '../../data/hooks/useExerciseProgressQuery';
import { useExercisePrQuery } from '../../data/hooks/useExercisePrQuery';
import { useSessionProgressQuery } from '../../data/hooks/useSessionProgressQuery';
import { useMicrocycleProgressQuery } from '../../data/hooks/useMicrocycleProgressQuery';
import { useClientRoutineDaysQuery } from '../../data/hooks/useCalendarQuery';
import { QueryResult } from '../../components/AsyncStatus';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { buildClientCrumbs } from '../../layout/crumbs';
import { MetricDetailModal } from './progress/MetricDetailModal';
import { CalendarRangeModal } from './progress/CalendarRangeModal';
import { ProgressExerciseFilter } from './progress/ProgressExerciseFilter';
import { ProgressRoutineFilter } from './progress/ProgressRoutineFilter';
import { SessionDetailModal } from './progress/SessionDetailModal';
import {
  STRENGTH_VARIABLES,
  CARDIO_VARIABLES,
  PLIO_VARIABLES,
  MOBILITY_VARIABLES,
  ISOMETRIC_VARIABLES,
  SPORT_VARIABLES,
  MICROCYCLE_VARIABLES,
  getMicrocycleVarsForCategory,
  getSessionVarsForCategory,
} from './progress/progress-screen.variables';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import type { AnalysisMode, DateRange, VariableDef } from './progress/progress-screen.types';
import { Button, EmptyState, colors, fontSize, space } from '@trainerpro/ui';

import { ProgressFilters } from './progress/ProgressFilters';
import { KpiGrid } from './progress/KpiGrid';
import { MetricChart } from './progress/MetricChart';
import { InsightsPanel } from './progress/InsightsPanel';
import { ConsistencyHeatmap } from './progress/ConsistencyHeatmap';
import { buildKpis } from './progress/build-kpis';

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function useResetClientFilters(
  clientId: string | null,
  defaultVars: string[],
  setCustomRange: (value: DateRange | null) => void,
  setActiveVarIds: (value: Set<string>) => void,
): void {
  const previous = useRef(clientId);
  const defaults = useRef(defaultVars);
  useEffect(() => {
    if (previous.current === clientId) return;
    previous.current = clientId;
    setCustomRange(null);
    setActiveVarIds(new Set(defaults.current));
  }, [clientId, setActiveVarIds, setCustomRange]);
}

function buildRange(weeks: number): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - weeks * 7);
  return { from: toDateStr(from), to: toDateStr(to) };
}

type ProgressScreenProps = {
  onRouteChange?: (route: ShellRoute) => void;
};

// ── Main screen ───────────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function
export function ProgressScreen(props: ProgressScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { clientDisplayName, clientId } = useProgressRouteClient();
  const {
    mode,
    selectedCategory,
    selectedDayIndex,
    selectedExercise,
    selectedTemplateId,
    setMode,
    setSelectedCategory,
    setSelectedDayIndex,
    setSelectedExercise,
    setSelectedTemplateId,
    setWeeksPreset,
    weeksPreset,
  } = useProgressSelection(clientId);

  // Filters
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const range: DateRange = customRange ?? buildRange(weeksPreset);
  const selectedExerciseId = selectedExercise?.id ?? null;

  // Variable toggles
  const defaultVars = STRENGTH_VARIABLES.slice(0, 2).map((v) => v.id);
  const [activeVarIds, setActiveVarIds] = useState<Set<string>>(new Set(defaultVars));
  useResetClientFilters(clientId, defaultVars, setCustomRange, setActiveVarIds);

  // Detail modal
  const [detailVariable, setDetailVariable] = useState<VariableDef | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  // Progress queries
  const exerciseQuery = useExerciseProgressQuery(
    {
      clientId: clientId ?? undefined,
      exerciseId: selectedExerciseId ?? '',
      exerciseType: selectedExercise?.type ?? 'strength',
      from: range.from,
      to: range.to,
    },
    { enabled: Boolean(clientId) && Boolean(selectedExerciseId) && mode === 'exercise' },
  );
  const exercisePrQuery = useExercisePrQuery(
    {
      clientId: clientId ?? undefined,
      exerciseId: selectedExerciseId ?? '',
    },
    { enabled: Boolean(clientId) && Boolean(selectedExerciseId) && mode === 'exercise' },
  );
  const sessionQuery = useSessionProgressQuery(
    {
      clientId: clientId ?? undefined,
      templateId: selectedTemplateId ?? '',
      from: range.from,
      to: range.to,
      dayIndex: selectedDayIndex ?? undefined,
      category: selectedCategory ?? undefined,
    },
    {
      enabled:
        Boolean(clientId) &&
        Boolean(selectedTemplateId) &&
        selectedDayIndex !== null &&
        selectedCategory !== null &&
        mode === 'session',
    },
  );
  const microcycleQuery = useMicrocycleProgressQuery(
    {
      clientId: clientId ?? undefined,
      templateId: selectedTemplateId ?? undefined,
      category: selectedTemplateId && selectedCategory ? selectedCategory : undefined,
      from: range.from,
      to: range.to,
    },
    { enabled: Boolean(clientId) && mode === 'microcycle' },
  );
  const routineDaysQuery = useClientRoutineDaysQuery(selectedTemplateId);

  function getVarsForType(type: string) {
    if (type === 'cardio') return CARDIO_VARIABLES;
    if (type === 'plio') return PLIO_VARIABLES;
    if (type === 'isometric') return ISOMETRIC_VARIABLES;
    if (type === 'mobility') return MOBILITY_VARIABLES;
    if (type === 'sport') return SPORT_VARIABLES;
    return STRENGTH_VARIABLES;
  }

  function getExerciseVars() {
    return getVarsForType(selectedExercise?.type ?? 'strength');
  }

  const currentVars =
    mode === 'exercise'
      ? getExerciseVars()
      : mode === 'session'
        ? getSessionVarsForCategory(selectedCategory)
        : selectedTemplateId && selectedCategory
          ? getMicrocycleVarsForCategory(selectedCategory)
          : MICROCYCLE_VARIABLES;

  const chartPoints = useMemo(() => {
    if (mode === 'exercise') return (exerciseQuery.data ?? []) as Record<string, unknown>[];
    if (mode === 'session') return (sessionQuery.data ?? []) as Record<string, unknown>[];
    return (microcycleQuery.data?.points ?? []) as Record<string, unknown>[];
  }, [mode, exerciseQuery.data, sessionQuery.data, microcycleQuery.data]);

  const activeProgressQuery = mode === 'exercise' ? exerciseQuery : mode === 'session' ? sessionQuery : microcycleQuery;
  const isLoading = activeProgressQuery.isLoading;
  const hasSelection =
    mode === 'exercise'
      ? Boolean(selectedExerciseId)
      : mode === 'session'
        ? Boolean(selectedTemplateId) && selectedDayIndex !== null && selectedCategory !== null
        : true;

  const selectedExerciseName = selectedExercise?.name ?? '';

  useEffect(() => {
    if (mode !== 'session' || !selectedCategory) return;
    const vars = getSessionVarsForCategory(selectedCategory);
    const pick = vars.slice(0, Math.min(2, vars.length)).map((v) => v.id);
    if (pick.length > 0) setActiveVarIds(new Set(pick));
  }, [mode, selectedCategory]);

  useEffect(() => {
    if (mode !== 'microcycle') return;
    const vars =
      selectedTemplateId && selectedCategory ? getMicrocycleVarsForCategory(selectedCategory) : MICROCYCLE_VARIABLES;
    const pick = vars.slice(0, Math.min(2, vars.length)).map((v) => v.id);
    if (pick.length > 0) setActiveVarIds(new Set(pick));
  }, [mode, selectedTemplateId, selectedCategory]);

  function toggleVar(id: string): void {
    setActiveVarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleModeChange(m: AnalysisMode): void {
    setMode(m);
    if (m === 'exercise') {
      setSelectedDayIndex(null);
      setSelectedCategory(null);
      const vars = getVarsForType(selectedExercise?.type ?? 'strength');
      setActiveVarIds(new Set(vars.slice(0, 2).map((v) => v.id)));
    } else if (m === 'session') {
      setSelectedDayIndex(null);
      setSelectedCategory(null);
      setActiveVarIds(new Set());
    } else {
      setSelectedDayIndex(null);
      setSelectedCategory(null);
      setActiveVarIds(new Set(MICROCYCLE_VARIABLES.slice(0, 2).map((v) => v.id)));
    }
  }

  function openDetail(v: VariableDef): void {
    setDetailVariable(v);
    setShowDetailModal(true);
  }

  const activeVars = currentVars.filter((v) => activeVarIds.has(v.id));

  // KPIs
  const kpis = buildKpis({
    mode,
    points: chartPoints,
    range,
    exercisePr: exercisePrQuery.data ?? null,
    cycleDays: microcycleQuery.data?.cycleDays ?? null,
    planDaysCount: routineDaysQuery.data?.length ?? 0,
  });

  function goBackToClients(): void {
    props.onRouteChange?.('coach.clients');
  }

  if (!clientId) {
    return (
      <View style={styles.emptyWrap}>
        {props.onRouteChange ? (
          <Button
            label={`← ${t('common.back')}`}
            onPress={goBackToClients}
            size="sm"
            style={styles.backButtonCentered}
            variant="secondary"
          />
        ) : null}
        <EmptyState icon={<EmptyIllustration kind={'generic'} />} message={t('coach.progress.empty.subtitle')} title={t('coach.progress.empty.title')} />
      </View>
    );
  }

  const progressCrumbs = [
    ...buildClientCrumbs({ clientId, clientName: clientDisplayName ?? '', mode: 'progress', t }).slice(0, 2),
    { label: t('coach.progress.client.title'), to: null },
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {props.onRouteChange ? (
        <Button
          label={`← ${t('common.back')}`}
          onPress={goBackToClients}
          size="sm"
          style={styles.backButton}
          variant="secondary"
        />
      ) : null}
      {/* Breadcrumb */}
      <Breadcrumbs accessibilityLabel={t('app.breadcrumb')} crumbs={progressCrumbs} />
      <Text style={styles.subtitle}>{t('coach.progress.client.subtitle')}</Text>
      <ConsistencyHeatmap clientId={clientId} t={t} />

      <ProgressFilters
        mode={mode}
        onModeChange={handleModeChange}
        weeksPreset={weeksPreset}
        customRange={customRange}
        onPreset={(weeks) => {
          setWeeksPreset(weeks);
          setCustomRange(null);
        }}
        onCustom={() => setShowCalendarModal(true)}
        variables={hasSelection ? currentVars : []}
        activeVarIds={activeVarIds}
        onToggle={toggleVar}
        t={t}
      >
        {/* Filters */}
        {mode === 'exercise' ? (
          <ProgressExerciseFilter
            clientId={clientId}
            from={range.from}
            to={range.to}
            selected={selectedExercise}
            onSelect={(ex) => {
              setSelectedExercise(ex);
              const vars = getVarsForType(ex?.type ?? 'strength');
              setActiveVarIds(new Set(vars.slice(0, 2).map((v) => v.id)));
            }}
            t={t}
          />
        ) : (
          <ProgressRoutineFilter
            clientId={clientId}
            from={range.from}
            to={range.to}
            selectedId={selectedTemplateId}
            onSelect={(id) => {
              setSelectedTemplateId(id);
              setSelectedDayIndex(null);
              setSelectedCategory(null);
            }}
            showDaySelector={mode === 'session'}
            selectedDayIndex={selectedDayIndex}
            onDaySelect={(idx) => {
              setSelectedDayIndex(idx);
              if (idx === null) setSelectedCategory(null);
            }}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            showCategorySelector={mode === 'microcycle'}
            t={t}
          />
        )}

        {mode === 'microcycle' && microcycleQuery.data != null && !microcycleQuery.isLoading && (
          <Text style={styles.microcycleMeta}>
            {t('coach.progress.microcycle.cycleDays', { days: microcycleQuery.data.cycleDays })}
          </Text>
        )}
      </ProgressFilters>

      {/* KPIs */}
      {hasSelection && chartPoints.length > 0 && <KpiGrid items={kpis} t={t} />}

      {!hasSelection && <ProgressEmptyState t={t} />}
      {hasSelection ? (
        <QueryResult
          emptyTitle={t('coach.progress.empty')}
          skeleton={'panel'}
          error={activeProgressQuery.error}
          isError={activeProgressQuery.isError}
          isLoading={isLoading}
          itemCount={chartPoints.length}
          onRetry={() => void activeProgressQuery.refetch()}
        />
      ) : null}
      {hasSelection && !activeProgressQuery.isError && !isLoading && chartPoints.length > 0 && (
        <View style={styles.chartsGrid}>
          {activeVars.map((v) => (
            <MetricChart
              key={v.id}
              variable={v}
              data={chartPoints}
              xKey={mode === 'microcycle' ? 'weekStart' : 'sessionDate'}
              onExpand={() => openDetail(v)}
              t={t}
            />
          ))}
        </View>
      )}

      {/* Insights */}
      {hasSelection && chartPoints.length > 0 && (
        <InsightsPanel clientId={clientId ?? undefined} mode={mode} points={chartPoints} t={t} />
      )}

      {/* Modals */}
      <MetricDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        variable={detailVariable}
        exerciseName={selectedExerciseName}
        data={exerciseQuery.data ?? []}
      />
      {mode === 'session' && (sessionQuery.data ?? []).length > 0 ? (
        <View style={styles.variablesRow}>
          {(sessionQuery.data ?? []).map((point) => (
            <Button
              key={point.sessionId}
              label={`${point.sessionDate} · ${t('coach.progress.sessionDetail.open')}`}
              onPress={() => setDetailSessionId(point.sessionId)}
              size="sm"
              variant="secondary"
            />
          ))}
        </View>
      ) : null}

      <SessionDetailModal onClose={() => setDetailSessionId(null)} sessionId={detailSessionId} />
      <CalendarRangeModal
        visible={showCalendarModal}
        range={range}
        onConfirm={(r) => setCustomRange(r)}
        onClose={() => setShowCalendarModal(false)}
      />
    </ScrollView>
  );
}

function ProgressEmptyState({ t }: { t: (k: string) => string }) {
  return (
    <EmptyState
      icon={<Text style={styles.emptyIcon}>{t('coach.progress.empty.icon')}</Text>}
      message={t('coach.progress.empty.subtitle')}
      title={t('coach.progress.empty.title')}
    />
  );
}

const styles = StyleSheet.create({
  chartsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, width: '100%' },
  page: { backgroundColor: colors.background, padding: space.xl, gap: space.lg, minHeight: '100%' },
  backButton: { alignSelf: 'flex-start' },
  backButtonCentered: { alignSelf: 'center' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  breadcrumbClient: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  breadcrumbSep: { color: colors.textMuted, fontSize: fontSize.sm, marginHorizontal: space.xs },
  breadcrumbTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, width: '100%' },
  microcycleMeta: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700', width: '100%' },
  scrollRow: { maxWidth: '100%', flexGrow: 0 },
  topBar: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  variablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  loading: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: space.xl },
  noData: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: space.xl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: space.md },
  emptyIcon: { fontSize: 48 },
});
