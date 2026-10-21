import React from 'react';
import type { TFunction } from 'i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QueryResult } from '../../components/AsyncStatus';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { Button, EmptyState, colors, fontSize, space } from '@trainerpro/ui';
import { ProgressPdfButton } from '../../features/pdf/ProgressPdfButton';
import { CalendarRangeModal } from './progress/CalendarRangeModal';
import { AdherenceSummary } from './progress/AdherenceSummary';
import { ConsistencyHeatmap } from './progress/ConsistencyHeatmap';
import { InsightsPanel } from './progress/InsightsPanel';
import { KpiGrid } from './progress/KpiGrid';
import { MetricChart } from './progress/MetricChart';
import { MetricDetailModal } from './progress/MetricDetailModal';
import { ProgressExerciseFilter } from './progress/ProgressExerciseFilter';
import { ProgressFilters } from './progress/ProgressFilters';
import { ProgressRoutineFilter } from './progress/ProgressRoutineFilter';
import { SessionDetailModal } from './progress/SessionDetailModal';
import type { AnalysisMode, DateRange, SelectedExercise, VariableDef } from './progress/progress-screen.types';
import type { SessionProgressCategory } from '../../data/types/session-progress';
import type { ExerciseProgressPoint } from '../../data/hooks/useExerciseProgressQuery';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import type { Crumb } from '../../layout/crumbs';

export type ProgressViewInput = {
  activeProgressQuery: {
    data?: unknown;
    error: unknown;
    isError: boolean;
    isFetching: boolean;
    isLoading: boolean;
    refetch: () => unknown;
  };
  activeVarIds: Set<string>;
  activeVars: VariableDef[];
  chartPoints: Record<string, unknown>[];
  clientDisplayName: string | null | undefined;
  clientId: string;
  currentVars: VariableDef[];
  customRange: DateRange | null;
  detailSessionId: string | null;
  detailVariable: VariableDef | null;
  exercisePrQuery: { isError: boolean; isFetching: boolean; isPending: boolean };
  exerciseQuery: { data?: ExerciseProgressPoint[] };
  getVarsForType: (type: string) => VariableDef[];
  goBackToClients: () => void;
  handleModeChange: (mode: AnalysisMode) => void;
  hasSelection: boolean;
  isLoading: boolean;
  kpis: Array<{ id: string; label: string; value: string }>;
  microcycleQuery: { data?: { cycleDays: number } | null; isLoading: boolean };
  mode: AnalysisMode;
  openDetail: (variable: VariableDef) => void;
  progressCrumbs: Crumb[];
  range: DateRange;
  routineDaysQuery: {
    data?: Array<{ dayIndex: number; title?: string }>;
    isError: boolean;
    isFetching: boolean;
    isPending: boolean;
  };
  screen: { onRouteChange?: (route: ShellRoute) => void };
  selectedCategory: SessionProgressCategory | null;
  selectedDayIndex: number | null;
  selectedExercise: SelectedExercise | null;
  selectedExerciseName: string;
  selectedTemplateId: string | null;
  sessionQuery: {
    data?: Array<{ sessionDate: string; sessionId: string; outcome?: import('@trainerpro/shared').SessionOutcome }>;
  };
  setActiveVarIds: (value: Set<string>) => void;
  setCustomRange: (value: DateRange | null) => void;
  setDetailSessionId: (value: string | null) => void;
  setSelectedCategory: (value: SessionProgressCategory | null) => void;
  setSelectedDayIndex: (value: number | null) => void;
  setSelectedExercise: (value: SelectedExercise | null) => void;
  setSelectedTemplateId: (value: string | null) => void;
  setShowCalendarModal: (value: boolean) => void;
  setShowDetailModal: (value: boolean) => void;
  setWeeksPreset: (value: 4 | 8 | 12) => void;
  showCalendarModal: boolean;
  showDetailModal: boolean;
  t: TFunction;
  toggleVar: (id: string) => void;
  weeksPreset: 4 | 8 | 12;
};

// eslint-disable-next-line max-lines-per-function
export function ProgressView(input: ProgressViewInput): React.JSX.Element {
  const props = input.screen;
  const {
    activeProgressQuery,
    activeVarIds,
    activeVars,
    chartPoints,
    clientDisplayName,
    clientId,
    currentVars,
    customRange,
    detailSessionId,
    detailVariable,
    exercisePrQuery,
    exerciseQuery,
    getVarsForType,
    goBackToClients,
    handleModeChange,
    hasSelection,
    isLoading,
    kpis,
    microcycleQuery,
    mode,
    openDetail,
    progressCrumbs,
    range,
    routineDaysQuery,
    selectedCategory,
    selectedDayIndex,
    selectedExercise,
    selectedExerciseName,
    selectedTemplateId,
    sessionQuery,
    setActiveVarIds,
    setCustomRange,
    setDetailSessionId,
    setSelectedCategory,
    setSelectedDayIndex,
    setSelectedExercise,
    setSelectedTemplateId,
    setShowCalendarModal,
    setShowDetailModal,
    setWeeksPreset,
    showCalendarModal,
    showDetailModal,
    t,
    toggleVar,
    weeksPreset,
  } = input;
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
      <ProgressPdfButton
        clientId={clientId}
        clientName={clientDisplayName ?? ''}
        disabled={
          !hasSelection ||
          isLoading ||
          activeProgressQuery.isError ||
          activeProgressQuery.isFetching ||
          (mode === 'exercise' && (exercisePrQuery.isPending || exercisePrQuery.isError || exercisePrQuery.isFetching)) ||
          (mode !== 'exercise' &&
            Boolean(selectedTemplateId) &&
            (routineDaysQuery.isPending || routineDaysQuery.isError || routineDaysQuery.isFetching))
        }
        mode={mode}
        range={range}
        exerciseName={selectedExerciseName}
        exerciseId={selectedExercise?.id}
        templateId={selectedTemplateId}
        dayIndex={selectedDayIndex}
        dayName={routineDaysQuery.data?.find((day) => day.dayIndex === selectedDayIndex)?.title}
        category={selectedCategory}
        variables={activeVars}
        points={chartPoints}
        kpis={kpis}
        t={t}
      />
      <ConsistencyHeatmap clientId={clientId} t={t} />
      <AdherenceSummary
        clientId={clientId}
        {...range}
        templateId={mode === 'exercise' ? undefined : selectedTemplateId}
        t={t}
      />

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
              label={`${point.sessionDate.slice(0, 10)} · ${point.outcome ? t('training.outcome.' + point.outcome) : ''} · ${t('coach.progress.sessionDetail.open')}`}
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

export const styles = StyleSheet.create({
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
