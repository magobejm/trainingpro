/* eslint-disable max-lines */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { buildInsights } from './progress/build-insights';
import type { ExerciseProgressPoint } from '../../data/hooks/useExerciseProgressQuery';
import type { MicrocycleProgressPoint } from '../../data/hooks/useMicrocycleProgressQuery';
import type { SessionProgressPoint } from '../../data/hooks/useSessionProgressQuery';
import { Button, EmptyState, SegmentedControl, colors, fontSize, radius, space, useBreakpoint } from '@trainerpro/ui';

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
        <EmptyState message={t('coach.progress.empty.subtitle')} title={t('coach.progress.empty.title')} />
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

      {/* Mode + range selector */}
      <View style={styles.topBar}>
        <ModeSelector mode={mode} onChange={handleModeChange} t={t} />
        <RangeSelector
          weeksPreset={weeksPreset}
          customRange={customRange}
          onPreset={(w) => {
            setWeeksPreset(w);
            setCustomRange(null);
          }}
          onCustom={() => setShowCalendarModal(true)}
          t={t}
        />
      </View>

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

      {/* Variables */}
      {hasSelection && (
        <View style={styles.variablesRow}>
          {currentVars.map((v) => (
            <VariablePill key={v.id} variable={v} active={activeVarIds.has(v.id)} onToggle={() => toggleVar(v.id)} t={t} />
          ))}
        </View>
      )}

      {/* KPIs */}
      {hasSelection && chartPoints.length > 0 && (
        <div style={kpiGrid}>
          {kpis.map((kpi) => (
            <div key={kpi.id} style={kpiCard}>
              <p style={kpiLabelStyle}>{t(kpi.label)}</p>
              <p style={kpiValueStyle}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {!hasSelection && <ProgressEmptyState t={t} />}
      {hasSelection ? (
        <QueryResult
          emptyTitle={t('coach.progress.empty')}
          error={activeProgressQuery.error}
          isError={activeProgressQuery.isError}
          isLoading={isLoading}
          itemCount={chartPoints.length}
          onRetry={() => void activeProgressQuery.refetch()}
        />
      ) : null}
      {hasSelection && !activeProgressQuery.isError && !isLoading && chartPoints.length > 0 && (
        <div style={chartsGrid}>
          {activeVars.map((v) => (
            <ChartCard
              key={v.id}
              variable={v}
              data={chartPoints}
              xKey={mode === 'microcycle' ? 'weekStart' : 'sessionDate'}
              onExpand={() => openDetail(v)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Insights */}
      {hasSelection && chartPoints.length > 0 && <InsightBlock mode={mode} points={chartPoints} t={t} />}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeSelector({
  mode,
  onChange,
  t,
}: {
  mode: AnalysisMode;
  onChange: (m: AnalysisMode) => void;
  t: (k: string) => string;
}) {
  const modes: { id: AnalysisMode; key: string }[] = [
    { id: 'exercise', key: 'coach.progress.filter.mode.exercise' },
    { id: 'session', key: 'coach.progress.filter.mode.session' },
    { id: 'microcycle', key: 'coach.progress.filter.mode.microcycle' },
  ];
  return (
    <ScrollIfCompact>
      <SegmentedControl
        onChange={(value) => onChange(value as AnalysisMode)}
        options={modes.map((m) => ({ label: t(m.key), value: m.id }))}
        value={mode}
      />
    </ScrollIfCompact>
  );
}

function RangeSelector({
  weeksPreset,
  customRange,
  onPreset,
  onCustom,
  t,
}: {
  weeksPreset: number;
  customRange: DateRange | null;
  onPreset: (w: 4 | 8 | 12) => void;
  onCustom: () => void;
  t: (k: string) => string;
}) {
  const customLabel = customRange ? `${customRange.from} – ${customRange.to}` : t('coach.progress.range.custom');
  const options = [
    ...([4, 8, 12] as const).map((w) => ({ label: t(`coach.progress.range.${w}w`), value: String(w) })),
    { label: customLabel, value: 'custom' },
  ];
  return (
    <ScrollIfCompact>
      <SegmentedControl
        accessibilityLabel={t('coach.progress.range.label')}
        onChange={(value) => {
          if (value === 'custom') onCustom();
          else onPreset(Number(value) as 4 | 8 | 12);
        }}
        options={options}
        value={customRange ? 'custom' : String(weeksPreset)}
      />
    </ScrollIfCompact>
  );
}

function ScrollIfCompact({ children }: { children: React.ReactNode }): React.JSX.Element {
  const compact = useBreakpoint() === 'sm';
  if (!compact) return <>{children}</>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
      {children}
    </ScrollView>
  );
}

function VariablePill({
  variable,
  active,
  onToggle,
  t,
}: {
  variable: VariableDef;
  active: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}) {
  return (
    <button
      style={{
        ...pill,
        ...(active ? { background: variable.color, borderColor: variable.color, color: colors.surface } : {}),
      }}
      onClick={onToggle}
    >
      {t(variable.labelKey)}
    </button>
  );
}

function ChartCard({
  variable,
  data,
  xKey,
  onExpand,
  t,
}: {
  variable: VariableDef;
  data: Record<string, unknown>[];
  xKey: string;
  onExpand: () => void;
  t: (k: string) => string;
}) {
  const fullSize = '100%';
  const axisZero = '0';
  const axisOne = '1';
  const gradStart = '5%';
  const gradEnd = '95%';
  const gridDash = '3 3';
  const dateKey = 'date';
  const valueKey = 'value';
  const chartType = 'monotone';
  const fillUrl = `url(#grad-${variable.id})`;
  const gridColor = colors.background;
  const chartData = data.map((pt) => ({
    date: String(pt[xKey] ?? '').slice(5),
    value: pt[variable.dataKey] ?? 0,
  }));

  return (
    <div style={chartCard}>
      <div style={chartCardHeader}>
        <p style={chartCardTitle}>{t(variable.labelKey)}</p>
        <Button label={t('coach.progress.chart.detailCta')} onPress={onExpand} size="sm" variant="ghost" />
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width={fullSize} height={fullSize}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${variable.id}`} x1={axisZero} y1={axisZero} x2={axisZero} y2={axisOne}>
                <stop offset={gradStart} stopColor={variable.color} stopOpacity={0.22} />
                <stop offset={gradEnd} stopColor={variable.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray={gridDash} stroke={gridColor} />
            <XAxis dataKey={dateKey} tick={{ fontSize: fontSize.xs }} />
            <YAxis tick={{ fontSize: fontSize.xs }} />
            <Tooltip
              formatter={(v) => [`${Math.round((Number(v) || 0) * 10) / 10} ${variable.unit}`, t(variable.labelKey)]}
            />
            <Area
              type={chartType}
              dataKey={valueKey}
              stroke={variable.color}
              fill={fillUrl}
              strokeWidth={2}
              dot={{ r: 3, fill: variable.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightBlock({
  mode,
  points,
  t,
}: {
  mode: AnalysisMode;
  points: Record<string, unknown>[];
  t: (k: string) => string;
}) {
  const insights = buildInsights(mode, points);
  if (insights.length === 0) return null;

  return (
    <div style={insightWrap}>
      <p style={insightTitle}>{t('coach.progress.insight.title')}</p>
      <div style={insightCards}>
        {insights.map((item, idx) => {
          const cardStyle = { ...insightCard, borderLeft: `4px solid ${item.color}` };
          return (
            <div key={idx} style={cardStyle}>
              <p style={insightText}>
                <span>{item.emoji}</span> <span>{item.text}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
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

// ── KPI builder ───────────────────────────────────────────────────────────────

function daysBetweenInclusive(from: string, to: string): number {
  const t0 = new Date(`${from}T00:00:00.000Z`).getTime();
  const t1 = new Date(`${to}T00:00:00.000Z`).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return 0;
  return Math.floor((t1 - t0) / 86400000) + 1;
}

function formatMetric(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) return '—';
  const n = Math.pow(10, decimals);
  return `${Math.round(value * n) / n}`;
}

function buildKpis(input: {
  mode: AnalysisMode;
  points: Record<string, unknown>[];
  range: DateRange;
  exercisePr: number | null;
  cycleDays: number | null;
  planDaysCount: number;
}) {
  if (input.points.length === 0) return [];
  if (input.mode === 'exercise') {
    const exercisePoints = input.points as ExerciseProgressPoint[];
    const maxE1rm = Math.max(...exercisePoints.map((p) => p.e1rm ?? 0));
    const totalDays = Math.max(1, daysBetweenInclusive(input.range.from, input.range.to));
    const weeklyFrequency = exercisePoints.length / (totalDays / 7);
    return [
      { id: 'e1rm', label: 'coach.progress.kpi.e1rm', value: `${Math.round(maxE1rm)} kg` },
      { id: 'weeklyFrequency', label: 'coach.progress.kpi.weeklyFrequency', value: formatMetric(weeklyFrequency, 2) },
      {
        id: 'historicPr',
        label: 'coach.progress.kpi.historicPr',
        value: input.exercisePr !== null ? `${Math.round(input.exercisePr)} kg` : '—',
      },
    ];
  }
  if (input.mode === 'session') {
    const sessionPoints = input.points as SessionProgressPoint[];
    const withDuration = sessionPoints.filter((p) => p.durationMinutes !== null);
    const avgDuration =
      withDuration.length > 0 ? withDuration.reduce((s, p) => s + (p.durationMinutes ?? 0), 0) / withDuration.length : null;
    const withIntensity = sessionPoints.filter((p) => p.avgIntensityPercent !== null);
    const avgIntensity =
      withIntensity.length > 0
        ? withIntensity.reduce((s, p) => s + (p.avgIntensityPercent ?? 0), 0) / withIntensity.length
        : null;
    const peakLoad = Math.max(...sessionPoints.map((p) => p.peakLoadKg ?? 0));
    return [
      {
        id: 'avgSessionTime',
        label: 'coach.progress.kpi.avgSessionTime',
        value: avgDuration !== null ? `${Math.round(avgDuration)} min` : '—',
      },
      {
        id: 'avgIntensity',
        label: 'coach.progress.kpi.avgIntensity',
        value: avgIntensity !== null ? `${formatMetric(avgIntensity, 1)}%` : '—',
      },
      { id: 'peakLoad', label: 'coach.progress.kpi.peakLoad', value: `${Math.round(peakLoad)} kg` },
    ];
  }

  const microPoints = input.points as MicrocycleProgressPoint[];
  const totalSessions = microPoints.reduce((s, p) => s + p.sessionsCount, 0);
  const cycleDays = Math.max(1, input.cycleDays ?? 7);
  const totalRangeDays = Math.max(1, daysBetweenInclusive(input.range.from, input.range.to));
  const cyclesInRange = Math.floor(totalRangeDays / cycleDays);
  const expectedSessions = input.planDaysCount > 0 ? input.planDaysCount * cyclesInRange : 0;
  const adherence = expectedSessions > 0 ? (totalSessions / expectedSessions) * 100 : null;
  const firstE1rm = microPoints[0]?.avgE1rm ?? null;
  const lastE1rm = microPoints[microPoints.length - 1]?.avgE1rm ?? null;
  const globalStrengthGain =
    firstE1rm !== null && firstE1rm > 0 && lastE1rm !== null ? ((lastE1rm - firstE1rm) / firstE1rm) * 100 : null;
  const recordsBroken = microPoints.reduce((s, p) => s + (p.recordsBroken ?? 0), 0);
  return [
    {
      id: 'adherence',
      label: 'coach.progress.kpi.adherence',
      value: adherence !== null ? `${formatMetric(adherence, 1)}%` : '—',
    },
    {
      id: 'globalStrengthGain',
      label: 'coach.progress.kpi.globalStrengthGain',
      value: globalStrengthGain !== null ? `${formatMetric(globalStrengthGain, 1)}%` : '—',
    },
    { id: 'recordsBroken', label: 'coach.progress.kpi.recordsBroken', value: `${recordsBroken}` },
  ];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const C = {
  bg: colors.background,
  text: colors.text,
  muted: colors.textMuted,
  card: colors.surface,
  border: colors.background,
};

const styles = StyleSheet.create({
  page: { backgroundColor: C.bg, padding: space.xl, gap: space.lg, minHeight: '100%' },
  backButton: { alignSelf: 'flex-start' },
  backButtonCentered: { alignSelf: 'center' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  breadcrumbClient: { color: C.muted, fontSize: fontSize.sm, fontWeight: '700' },
  breadcrumbSep: { color: C.muted, fontSize: fontSize.sm, marginHorizontal: space.xs },
  breadcrumbTitle: { color: C.text, fontSize: fontSize.sm, fontWeight: '900' },
  subtitle: { color: C.muted, fontSize: fontSize.sm, width: '100%' },
  microcycleMeta: { color: C.muted, fontSize: fontSize.sm, fontWeight: '700', width: '100%' },
  scrollRow: { maxWidth: '100%', flexGrow: 0 },
  topBar: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  variablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  loading: { color: C.muted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: space.xl },
  noData: { color: C.muted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: space.xl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: space.md },
  emptyIcon: { fontSize: 48 },
});

// CSS-in-JS for non-RN elements

const pill: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 20,
  border: `1.5px solid ${colors.border}`,
  background: colors.background,
  color: C.muted,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: fontSize.xs,
};

const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: space.lg,
  width: '100%',
};
const kpiCard: React.CSSProperties = {
  background: colors.surface,
  borderRadius: 16,
  padding: '18px 20px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};
const kpiLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: fontSize.xs,
  fontWeight: 800,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const kpiValueStyle: React.CSSProperties = { margin: '6px 0 0', fontSize: fontSize.xl, fontWeight: 900, color: C.text };

const chartsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
  gap: space.lg,
  width: '100%',
};
const chartCard: React.CSSProperties = {
  background: colors.surface,
  borderRadius: 20,
  padding: '20px 16px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};
const chartCardHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: space.md,
};
const chartCardTitle: React.CSSProperties = { margin: 0, fontWeight: 800, fontSize: fontSize.sm, color: C.text };

const insightWrap: React.CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', gap: space.md };
const insightTitle: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, fontWeight: 800, color: C.text };
const insightCards: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: space.md };
const insightCard: React.CSSProperties = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: '14px 18px',
  border: `1px solid ${C.border}`,
};
const insightText: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, fontWeight: 600, color: C.muted };
