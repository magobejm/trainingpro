/* eslint-disable max-lines */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../i18n';
import { useProgressContextStore } from '../../store/progressContext.store';
import { useExerciseProgressQuery } from '../../data/hooks/useExerciseProgressQuery';
import { useSessionProgressQuery } from '../../data/hooks/useSessionProgressQuery';
import { useMicrocycleProgressQuery } from '../../data/hooks/useMicrocycleProgressQuery';
import { MetricDetailModal } from './progress/MetricDetailModal';
import { CalendarRangeModal } from './progress/CalendarRangeModal';
import { ProgressExerciseFilter } from './progress/ProgressExerciseFilter';
import { ProgressRoutineFilter } from './progress/ProgressRoutineFilter';
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
import type { AnalysisMode, DateRange, SelectedExercise, VariableDef } from './progress/progress-screen.types';
import type { SessionProgressCategory } from '../../data/types/session-progress';
import { buildInsights } from './progress/build-insights';
import type { ExerciseProgressPoint } from '../../data/hooks/useExerciseProgressQuery';

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const clientId = useProgressContextStore((s) => s.clientId);
  const clientDisplayName = useProgressContextStore((s) => s.clientDisplayName);

  // Filters
  const [mode, setMode] = useState<AnalysisMode>('exercise');
  const [weeksPreset, setWeeksPreset] = useState<4 | 8 | 12>(8);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const range: DateRange = customRange ?? buildRange(weeksPreset);

  // Selection
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SessionProgressCategory | null>(null);

  const selectedExerciseId = selectedExercise?.id ?? null;

  // Variable toggles
  const defaultVars = STRENGTH_VARIABLES.slice(0, 2).map((v) => v.id);
  const [activeVarIds, setActiveVarIds] = useState<Set<string>>(new Set(defaultVars));

  // Detail modal
  const [detailVariable, setDetailVariable] = useState<VariableDef | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const isLoading =
    mode === 'exercise' ? exerciseQuery.isLoading : mode === 'session' ? sessionQuery.isLoading : microcycleQuery.isLoading;
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
  const kpis = buildKpis(mode, chartPoints);

  function goBackToClients(): void {
    props.onRouteChange?.('coach.clients');
  }

  if (!clientId) {
    return (
      <View style={styles.emptyWrap}>
        {props.onRouteChange ? (
          <Pressable onPress={goBackToClients} style={styles.backButton}>
            <Text style={styles.backButtonText}>{`← ${t('common.back')}`}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.emptyTitle}>{t('coach.progress.empty.title')}</Text>
        <Text style={styles.emptySubtitle}>{t('coach.progress.empty.subtitle')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {props.onRouteChange ? (
        <Pressable onPress={goBackToClients} style={styles.backButton}>
          <Text style={styles.backButtonText}>{`← ${t('common.back')}`}</Text>
        </Pressable>
      ) : null}
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbClient}>{clientDisplayName}</Text>
        <Text style={styles.breadcrumbSep}>{' › '}</Text>
        <Text style={styles.breadcrumbTitle}>{t('coach.progress.client.title')}</Text>
      </View>
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

      {/* Empty / loading / charts */}
      {!hasSelection && <EmptyState t={t} />}
      {hasSelection && isLoading && <Text style={styles.loading}>{t('coach.progress.loading')}</Text>}
      {hasSelection && !isLoading && chartPoints.length === 0 && (
        <Text style={styles.noData}>{t('coach.progress.empty')}</Text>
      )}
      {hasSelection && !isLoading && chartPoints.length > 0 && (
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
    <div style={modeRow}>
      {modes.map((m) => (
        <button key={m.id} style={{ ...modeBtn, ...(mode === m.id ? modeBtnActive : {}) }} onClick={() => onChange(m.id)}>
          {t(m.key)}
        </button>
      ))}
    </div>
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
  return (
    <div style={rangeRow}>
      {([4, 8, 12] as const).map((w) => (
        <button
          key={w}
          style={{ ...rangeBtn, ...(!customRange && weeksPreset === w ? rangeBtnActive : {}) }}
          onClick={() => onPreset(w)}
        >
          {t(`coach.progress.range.${w}w`)}
        </button>
      ))}
      <button style={{ ...rangeBtn, ...(customRange ? rangeBtnActive : {}) }} onClick={onCustom}>
        {customRange ? `${customRange.from} – ${customRange.to}` : t('coach.progress.range.custom')}
      </button>
    </div>
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
        ...(active ? { background: variable.color, borderColor: variable.color, color: '#fff' } : {}),
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
  const gridColor = '#f0f4f8';
  const chartData = data.map((pt) => ({
    date: String(pt[xKey] ?? '').slice(5),
    value: pt[variable.dataKey] ?? 0,
  }));

  return (
    <div style={chartCard}>
      <div style={chartCardHeader}>
        <p style={chartCardTitle}>{t(variable.labelKey)}</p>
        <button style={expandBtn} onClick={onExpand}>
          {t('coach.progress.chart.detailCta')}
        </button>
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
            <XAxis dataKey={dateKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
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

function EmptyState({ t }: { t: (k: string) => string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{t('coach.progress.empty.icon')}</Text>
      <Text style={styles.emptyTitle}>{t('coach.progress.empty.title')}</Text>
      <Text style={styles.emptySubtitle}>{t('coach.progress.empty.subtitle')}</Text>
    </View>
  );
}

// ── KPI builder ───────────────────────────────────────────────────────────────

function buildKpis(mode: AnalysisMode, points: Record<string, unknown>[]) {
  if (points.length === 0) return [];
  if (mode === 'exercise') {
    const exercisePoints = points as ExerciseProgressPoint[];
    const maxE1rm = Math.max(...exercisePoints.map((p) => p.e1rm ?? 0));
    const totalTonnage = exercisePoints.reduce((s, p) => s + p.tonnage, 0);
    const pointsWithRpe = exercisePoints.filter((p) => p.avgRpe !== null);
    const avgRpe = pointsWithRpe.reduce((s, p) => s + (p.avgRpe ?? 0), 0) / pointsWithRpe.length;
    return [
      { id: 'e1rm', label: 'coach.progress.kpi.maxE1rm', value: `${Math.round(maxE1rm)} kg` },
      { id: 'tonnage', label: 'coach.progress.kpi.totalTonnage', value: `${Math.round(totalTonnage)} kg` },
      {
        id: 'rpe',
        label: 'coach.progress.kpi.avgRpe',
        value: Number.isNaN(avgRpe) ? '—' : `${Math.round(avgRpe * 10) / 10}`,
      },
    ];
  }
  if (mode === 'session') {
    const sessionTons = points.reduce((s, p) => s + Number(p['sessionTonnage'] ?? 0), 0);
    const count = points.length;
    return [
      { id: 'tonnage', label: 'coach.progress.kpi.accumulatedTonnage', value: `${Math.round(sessionTons)} kg` },
      { id: 'sessions', label: 'coach.progress.kpi.sessions', value: `${count}` },
    ];
  }
  // microcycle
  const weeks = points.length;
  const totalTon = points.reduce((s, p) => s + Number(p['totalTonnage'] ?? 0), 0);
  const sessions = points.reduce((s, p) => s + Number(p['sessionsCount'] ?? 0), 0);
  return [
    { id: 'weeks', label: 'coach.progress.kpi.weeks', value: `${weeks}` },
    { id: 'tonnage', label: 'coach.progress.kpi.totalTonnage', value: `${Math.round(totalTon)} kg` },
    { id: 'sessions', label: 'coach.progress.kpi.totalSessions', value: `${sessions}` },
  ];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const C = { bg: '#eef4fb', text: '#0f1b2f', muted: '#5d6f85', card: '#fff', border: '#e8edf3' };

const styles = StyleSheet.create({
  page: { backgroundColor: C.bg, padding: 20, gap: 14, minHeight: '100%' },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#64748b',
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  backButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  breadcrumbClient: { color: C.muted, fontSize: 14, fontWeight: '700' },
  breadcrumbSep: { color: C.muted, fontSize: 14, marginHorizontal: 4 },
  breadcrumbTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  subtitle: { color: C.muted, fontSize: 13, width: '100%' },
  microcycleMeta: { color: C.muted, fontSize: 13, fontWeight: '700', width: '100%' },
  topBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  variablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loading: { color: C.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  noData: { color: C.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { color: C.muted, fontSize: 14, textAlign: 'center', maxWidth: 400 },
});

// CSS-in-JS for non-RN elements
const modeRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const modeBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  border: '1.5px solid #dce3eb',
  background: '#fff',
  color: C.muted,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 13,
};
const modeBtnActive: React.CSSProperties = { background: C.text, color: '#fff', borderColor: C.text };

const rangeRow: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const rangeBtn: React.CSSProperties = {
  padding: '7px 13px',
  borderRadius: 8,
  border: '1.5px solid #dce3eb',
  background: '#fff',
  color: C.muted,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 12,
};
const rangeBtnActive: React.CSSProperties = { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' };

const pill: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 20,
  border: '1.5px solid #dce3eb',
  background: '#f0f4f8',
  color: C.muted,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 12,
};

const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 14,
  width: '100%',
};
const kpiCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '18px 20px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};
const kpiLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const kpiValueStyle: React.CSSProperties = { margin: '6px 0 0', fontSize: 24, fontWeight: 900, color: C.text };

const chartsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 16,
  width: '100%',
};
const chartCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: '20px 16px',
  border: `1px solid ${C.border}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};
const chartCardHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};
const chartCardTitle: React.CSSProperties = { margin: 0, fontWeight: 800, fontSize: 14, color: C.text };
const expandBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 8,
  border: 'none',
  background: '#eff6ff',
  color: '#3b82f6',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 11,
};

const insightWrap: React.CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 };
const insightTitle: React.CSSProperties = { margin: 0, fontSize: 14, fontWeight: 800, color: C.text };
const insightCards: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
const insightCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: '14px 18px',
  border: `1px solid ${C.border}`,
};
const insightText: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: C.muted };
