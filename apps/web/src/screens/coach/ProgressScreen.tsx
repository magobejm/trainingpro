import { EmptyIllustration } from '../../components/EmptyIllustrations';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import '../../i18n';
import { useProgressRouteClient, useProgressSelection } from './progress/useProgressListState';
import { useExerciseProgressQuery } from '../../data/hooks/useExerciseProgressQuery';
import { useExercisePrQuery } from '../../data/hooks/useExercisePrQuery';
import { useSessionProgressQuery } from '../../data/hooks/useSessionProgressQuery';
import { useMicrocycleProgressQuery } from '../../data/hooks/useMicrocycleProgressQuery';
import { useClientRoutineDaysQuery } from '../../data/hooks/useCalendarQuery';

import { buildClientCrumbs } from '../../layout/crumbs';

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
import { Button, EmptyState } from '@trainerpro/ui';

import { buildKpis } from './progress/build-kpis';
import { ProgressView, styles } from './ProgressScreen.view';

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
        <EmptyState
          icon={<EmptyIllustration kind={'generic'} />}
          message={t('coach.progress.empty.subtitle')}
          title={t('coach.progress.empty.title')}
        />
      </View>
    );
  }

  const progressCrumbs = [
    ...buildClientCrumbs({ clientId, clientName: clientDisplayName ?? '', mode: 'progress', t }).slice(0, 2),
    { label: t('coach.progress.client.title'), to: null },
  ];

  return (
    <ProgressView
      activeProgressQuery={activeProgressQuery}
      activeVarIds={activeVarIds}
      activeVars={activeVars}
      chartPoints={chartPoints}
      clientDisplayName={clientDisplayName}
      clientId={clientId}
      currentVars={currentVars}
      customRange={customRange}
      detailSessionId={detailSessionId}
      detailVariable={detailVariable}
      exercisePrQuery={exercisePrQuery}
      exerciseQuery={exerciseQuery}
      getVarsForType={getVarsForType}
      goBackToClients={goBackToClients}
      handleModeChange={handleModeChange}
      hasSelection={hasSelection}
      isLoading={isLoading}
      kpis={kpis}
      microcycleQuery={microcycleQuery}
      mode={mode}
      openDetail={openDetail}
      progressCrumbs={progressCrumbs}
      range={range}
      routineDaysQuery={routineDaysQuery}
      screen={props}
      selectedCategory={selectedCategory}
      selectedDayIndex={selectedDayIndex}
      selectedExercise={selectedExercise}
      selectedExerciseName={selectedExerciseName}
      selectedTemplateId={selectedTemplateId}
      sessionQuery={sessionQuery}
      setActiveVarIds={setActiveVarIds}
      setCustomRange={setCustomRange}
      setDetailSessionId={setDetailSessionId}
      setSelectedCategory={setSelectedCategory}
      setSelectedDayIndex={setSelectedDayIndex}
      setSelectedExercise={setSelectedExercise}
      setSelectedTemplateId={setSelectedTemplateId}
      setShowCalendarModal={setShowCalendarModal}
      setShowDetailModal={setShowDetailModal}
      setWeeksPreset={setWeeksPreset}
      showCalendarModal={showCalendarModal}
      showDetailModal={showDetailModal}
      t={t}
      toggleVar={toggleVar}
      weeksPreset={weeksPreset}
    />
  );
}
