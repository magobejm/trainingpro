import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  cycleChartPoints,
  formatMetric,
  routineMetricDefs,
  selectedAdherence,
  type DashboardMetricDef,
  type ProgressRoutineCycle,
} from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';
import { MetricCard, MetricDetailSheet } from './ProgressMetricViews';
import { useProgressRoutine } from './use-progress-dashboard';

const SLIDE = 'slide' as const;

export function RoutineProgress(props: { assignmentId: string }): React.JSX.Element {
  const { t } = useTranslation();
  const query = useProgressRoutine(props.assignmentId);
  const [selected, setSelected] = useState<number[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [detail, setDetail] = useState<DashboardMetricDef | null>(null);
  const routine = query.data?.routine;
  const cycles = query.data?.cycles ?? [];
  useEffect(() => setSelected(null), [props.assignmentId]);
  if (query.isLoading) return <ActivityIndicator />;
  if (query.isError || !routine) return <Text style={styles.muted}>{t('progressDashboard.noData')}</Text>;
  const chosen = selected ?? cycles.map((c) => c.index);
  const compare = chosen.length > 1;
  const points = cycleChartPoints(cycles, chosen, compare);
  const adherence = selectedAdherence(cycles, chosen);
  const cycleDays = routine.cycleDays;
  const unit = cycleDays === 7 ? 'week' : 'cycle';
  const scope = { compare, cycleDays };
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <View style={styles.between}>
          <Text style={[styles.title, styles.flex]}>{routine.name}</Text>
          <Text style={routine.active ? styles.active : styles.muted}>
            {t(`progressDashboard.${routine.active ? 'active' : 'past'}`)}
          </Text>
        </View>
        <Text style={styles.muted}>
          {`${routine.from} — ${routine.to ?? t(`progressDashboard.${routine.active ? 'ongoing' : 'unknownEnd'}`)}`}
        </Text>
        <Text style={styles.muted}>
          {`${t('progressDashboard.objectives')}: ${routine.objectives.join(', ') || t('progressDashboard.noObjective')}`}
        </Text>
        <Text style={styles.muted}>{t('progressDashboard.cycleDays', { count: cycleDays })}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.between}>
          <Text style={styles.heading}>{t(`progressDashboard.${cycleDays === 7 ? 'cycles' : 'otherCycles'}`)}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!cycles.length}
            onPress={() => setPicking(true)}
            style={styles.compareBtn}
          >
            <Text style={styles.compareText}>{t(`progressDashboard.${cycleDays === 7 ? 'compare' : 'compareCycles'}`)}</Text>
          </Pressable>
        </View>
        {!cycles.length ? <Text style={styles.muted}>{t('progressDashboard.emptyCycles')}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {cycles.map((cycle) => (
            <CycleTile
              key={cycle.index}
              cycle={cycle}
              label={t(`progressDashboard.${unit}`, { count: cycle.index + 1 })}
              on={chosen.includes(cycle.index)}
              onPress={() => setSelected([cycle.index])}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.card}>
        <View style={styles.between}>
          <Text style={[styles.heading, styles.flex]}>
            {`${t('progressDashboard.adherence')} • ${formatMetric(adherence.percent ?? 0, '%')}`}
          </Text>
          <Text style={styles.adherenceCount}>{`${adherence.done} de ${adherence.planned} sesiones`}</Text>
        </View>
        <Text style={styles.text}>{t('progressDashboard.adherenceDetail', adherence)}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.min(100, adherence.percent ?? 0)}%` }]} />
        </View>
        <Text style={styles.note}>{t('progressDashboard.adherenceToday')}</Text>
      </View>
      {routineMetricDefs.map((metric) => (
        <MetricCard key={metric.key} metric={metric} onDetail={() => setDetail(metric)} points={points} scope={scope} />
      ))}
      {detail ? (
        <MetricDetailSheet
          metric={detail}
          onClose={() => setDetail(null)}
          points={points}
          scope={scope}
          title={routine.name}
        />
      ) : null}
      {picking ? (
        <CyclePicker
          cycles={cycles}
          initial={chosen}
          label={(index) => t(`progressDashboard.${unit}`, { count: index + 1 })}
          onClose={() => setPicking(false)}
          onConfirm={(next) => {
            setSelected(next);
            setPicking(false);
          }}
        />
      ) : null}
    </View>
  );
}

function CycleTile(props: { cycle: ProgressRoutineCycle; label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.on }}
      onPress={props.onPress}
      style={[styles.tile, props.on && styles.tileOn]}
    >
      <Text style={styles.heading}>{props.label}</Text>
      <Text style={styles.muted}>{`${props.cycle.from} — ${props.cycle.to}`}</Text>
    </Pressable>
  );
}

function CyclePicker(props: {
  cycles: ProgressRoutineCycle[];
  initial: number[];
  label: (index: number) => string;
  onClose: () => void;
  onConfirm: (selected: number[]) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<number[]>(props.initial);
  const toggle = (index: number) =>
    setDraft((cur) => (cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index]));
  return (
    <Modal animationType={SLIDE} onRequestClose={props.onClose} visible>
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('progressDashboard.compare')}</Text>
        <ScrollView contentContainerStyle={styles.stack}>
          {props.cycles.map((cycle) => (
            <Pressable
              key={cycle.index}
              accessibilityRole="button"
              accessibilityState={{ selected: draft.includes(cycle.index) }}
              onPress={() => toggle(cycle.index)}
              style={[styles.tile, styles.tileWide, draft.includes(cycle.index) && styles.tileOn]}
            >
              <Text style={styles.heading}>{props.label(cycle.index)}</Text>
              <Text style={styles.muted}>{`${cycle.from} — ${cycle.to}`}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.between}>
          <Pressable onPress={() => setDraft(props.cycles.map((c) => c.index))} style={styles.compareBtn}>
            <Text style={styles.compareText}>{t('progressDashboard.selectAll')}</Text>
          </Pressable>
          <Pressable onPress={props.onClose} style={styles.compareBtn}>
            <Text style={styles.compareText}>{t('progressDashboard.cancel')}</Text>
          </Pressable>
          <Pressable
            disabled={!draft.length}
            onPress={() => props.onConfirm([...draft].sort((a, b) => a - b))}
            style={[styles.confirmBtn, !draft.length && styles.disabled]}
          >
            <Text style={styles.confirmText}>{t('progressDashboard.confirm')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  active: { color: LIGHT.success, fontSize: 12, fontWeight: '800' },
  adherenceCount: { color: LIGHT.success, fontSize: 13, fontWeight: '800' },
  bar: { backgroundColor: '#e2e8f0', borderRadius: 6, height: 10, overflow: 'hidden', width: '100%' },
  barFill: { backgroundColor: LIGHT.emerald, height: 10 },
  between: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    width: '100%',
  },
  carousel: { gap: 8 },
  compareBtn: { backgroundColor: LIGHT.accentSoft, borderRadius: LIGHT.radiusMd, paddingHorizontal: 12, paddingVertical: 8 },
  compareText: { color: LIGHT.accent, fontSize: 12, fontWeight: '800' },
  confirmBtn: { backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusMd, paddingHorizontal: 14, paddingVertical: 8 },
  confirmText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.4 },
  flex: { flex: 1 },
  heading: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '800' },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  note: { color: LIGHT.textMuted, fontSize: 11, lineHeight: 16 },
  sheet: { backgroundColor: LIGHT.bgSoft, flex: 1, gap: 12, padding: 16, paddingTop: 56 },
  stack: { gap: 12, width: '100%' },
  text: { color: LIGHT.textStrong, fontSize: 13 },
  tile: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 2,
    minWidth: 150,
    opacity: 0.8,
    padding: 10,
  },
  tileOn: { backgroundColor: LIGHT.accentSoft, borderColor: LIGHT.accent, borderWidth: 2, opacity: 1 },
  tileWide: { width: '100%' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
