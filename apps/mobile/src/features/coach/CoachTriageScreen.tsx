import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NO_WORKOUT_DAYS, RISK_ADHERENCE } from '@trainerpro/shared';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { LIGHT } from '../../theme/light';
import { CoachPage, CoachStatus, ui } from './CoachUi';
import { useReadonlyCopy } from './coach-readonly-copy';
import {
  TRIAGE_TABS,
  categoryCount,
  openCount,
  totalOpenCount,
  type Triage,
  type TriageCategoryId,
  type TriageTabId,
} from './coach-triage-model';

const MAX_ROWS = 6;

export type TriageActions = {
  onChat: (clientId: string) => void;
  onClient: (clientId: string) => void;
  onFeature: (feature: string) => void;
  onIncident: (incidentId: string) => void;
};

type Row = { key: string; name: string; detail?: string; onPress: () => void };
type Copy = ReturnType<typeof useReadonlyCopy>;

export function CoachTriageScreen(props: TriageActions): React.JSX.Element {
  const c = useReadonlyCopy();
  const { i18n } = useTranslation();
  const query = useCoachQuery<Triage>('/coach/triage');
  const write = useCoachWrite();
  const [tab, setTab] = useState<TriageTabId>('chat');
  const data = query.data;
  const collapsed = data?.collapsed ?? [];
  const sections = buildSections(data, c, i18n.language, props);
  const toggle = (id: TriageCategoryId) => {
    const next = collapsed.includes(id) ? collapsed.filter((value) => value !== id) : [...collapsed, id];
    write.mutate({ path: '/coach/triage/collapsed', method: 'PUT', body: { collapsed: next } });
  };
  const categories = TRIAGE_TABS.find((entry) => entry.id === tab)?.categories ?? [];
  return (
    <CoachPage title={c('triage.title')}>
      <Text style={ui.muted}>{c('triage.subtitle')}</Text>
      <Text style={ui.label}>{c('triage.pending', { count: totalOpenCount(data, collapsed) })}</Text>
      <CoachStatus query={query} />
      <View style={styles.tabs}>
        {TRIAGE_TABS.map((entry) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: entry.id === tab }}
            key={entry.id}
            onPress={() => setTab(entry.id)}
            style={[styles.tab, entry.id === tab && styles.tabOn]}
          >
            <Text style={[styles.tabText, entry.id === tab && styles.tabTextOn]}>
              {c(('triage.tab.' + entry.id) as 'triage.tab.chat') +
                ' (' +
                openCount(data, entry.categories, collapsed) +
                ')'}
            </Text>
          </Pressable>
        ))}
      </View>
      {categories.map((id) => (
        <Section
          c={c}
          collapsed={collapsed.includes(id)}
          count={categoryCount(data, id)}
          hint={sections[id]?.hint}
          key={id}
          onToggle={() => toggle(id)}
          rows={sections[id]?.rows ?? []}
          title={sections[id]?.title ?? id}
        />
      ))}
    </CoachPage>
  );
}

function Section(props: {
  c: Copy;
  collapsed: boolean;
  count: number;
  hint?: string;
  onToggle: () => void;
  rows: Row[];
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? props.rows : props.rows.slice(0, MAX_ROWS);
  const hidden = props.rows.length - MAX_ROWS;
  return (
    <View style={ui.card}>
      <View style={styles.heading}>
        <Text style={ui.label}>{props.title + ' (' + props.count + ')'}</Text>
        <Pressable accessibilityRole="button" onPress={props.onToggle}>
          <Text style={styles.toggle}>{props.c(props.collapsed ? 'triage.show' : 'triage.fold')}</Text>
        </Pressable>
      </View>
      {props.collapsed ? (
        <Text style={ui.muted}>{props.c('triage.folded')}</Text>
      ) : (
        <>
          {props.hint ? <Text style={ui.muted}>{props.hint}</Text> : null}
          {props.rows.length === 0 ? (
            <Text style={ui.muted}>{'✓ ' + props.c('triage.empty')}</Text>
          ) : (
            visible.map((row) => (
              <Pressable accessibilityRole="button" key={row.key} onPress={row.onPress} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={ui.text}>{row.name}</Text>
                  {row.detail ? <Text style={ui.muted}>{row.detail}</Text> : null}
                </View>
                <Text style={ui.muted}>{'›'}</Text>
              </Pressable>
            ))
          )}
        </>
      )}
      {!props.collapsed && hidden > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)}>
          <Text style={styles.toggle}>{expanded ? props.c('triage.less') : props.c('triage.more', { count: hidden })}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function buildSections(
  data: Triage | undefined,
  c: Copy,
  language: string,
  go: TriageActions,
): Partial<Record<TriageCategoryId, { hint?: string; title: string; rows: Row[] }>> {
  const adherenceHint = c('triage.adherenceHint', {
    days: NO_WORKOUT_DAYS,
    percent: Math.round(RISK_ADHERENCE * 100),
  });
  return {
    chat: {
      hint: c('triage.chatHint'),
      title: c('triage.chat'),
      rows: (data?.chat ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: c('triage.chatSince', { date: formatSince(row.since, language) }),
        onPress: () => go.onChat(row.clientId),
      })),
    },
    incidents: {
      title: c('triage.incidents'),
      rows: (data?.incidents ?? []).map((row) => ({
        key: row.id,
        name: row.name,
        detail: row.severity,
        onPress: () => go.onIncident(row.id),
      })),
    },
    calls: {
      title: c('triage.calls'),
      rows: (data?.calls ?? []).map((row) => ({
        key: row.id,
        name: row.name,
        detail: row.time,
        onPress: () => go.onFeature('calendar'),
      })),
    },
    mood: {
      hint: c('triage.moodHint'),
      title: c('triage.mood'),
      rows: (data?.mood ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: moodDetail(row, c),
        onPress: () => go.onClient(row.clientId),
      })),
    },
    adherence: {
      hint: adherenceHint,
      title: c('triage.adherence'),
      rows: (data?.adherence ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: adherenceDetail(row, c),
        onPress: () => go.onClient(row.clientId),
      })),
    },
    reports: {
      title: c('triage.reports'),
      rows: (data?.reports ?? []).map((row) => ({
        key: row.id,
        name: row.name,
        detail: row.weekStart,
        onPress: () => go.onClient(row.clientId),
      })),
    },
    wearables: {
      title: c('triage.wearables'),
      rows: (data?.wearableSignals ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: wearableDetail(row, c),
        onPress: () => go.onClient(row.clientId),
      })),
    },
    routines: {
      hint: c('triage.routinesHint'),
      title: c('triage.routines'),
      rows: (data?.routines ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: routineLabel(row, c),
        onPress: () => go.onClient(row.clientId),
      })),
    },
    nutrition: {
      hint: c('triage.nutritionHint'),
      title: c('triage.nutrition'),
      rows: (data?.nutrition ?? []).map((row) => ({
        key: row.clientId,
        name: row.name,
        detail: c('triage.noNutrition'),
        onPress: () => go.onClient(row.clientId),
      })),
    },
  };
}

function formatSince(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language, { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' });
}

export function routineLabel(row: Triage['routines'][number], c: Copy): string {
  if (row.kind === 'noRoutine') return c('triage.noRoutine');
  if (row.kind === 'noCalendar') return c('triage.noCalendar');
  return c('triage.daysLeft', { count: row.daysLeft ?? 0 });
}

function adherenceDetail(row: Triage['adherence'][number], c: Copy): string {
  const parts: string[] = [];
  if (row.weekAdherence != null && row.weekAdherence < RISK_ADHERENCE) {
    parts.push(c('triage.adherenceValue', { value: Math.round(row.weekAdherence * 100) }));
  }
  if (row.daysWithoutWorkout != null && row.daysWithoutWorkout >= NO_WORKOUT_DAYS) {
    parts.push(c('triage.noWorkout', { days: row.daysWithoutWorkout }));
  }
  return parts.join(' · ');
}

function moodDetail(row: Triage['mood'][number], c: Copy): string {
  const values: Record<string, number | null> = {
    motivation: row.motivation,
    pain: row.pain,
    recovery: row.recovery,
    sleep: row.sleep,
  };
  return row.fields
    .map((field) => `${c(('triage.field.' + field) as 'triage.field.sleep')} ${values[field] ?? '-'}/5`)
    .join(' · ');
}

function wearableDetail(row: { hrvMs: number | null; sleepMinutes: number | null }, c: Copy): string {
  const parts: string[] = [];
  if (row.sleepMinutes !== null) parts.push(c('triage.sleep', { hours: (row.sleepMinutes / 60).toFixed(1) }));
  if (row.hrvMs !== null) parts.push(c('triage.hrv', { value: Math.round(row.hrvMs) }));
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: LIGHT.accent },
  tabText: { color: LIGHT.textMuted, fontSize: 14 },
  tabTextOn: { color: LIGHT.accent, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: LIGHT.radiusMd,
    backgroundColor: LIGHT.bgSoft,
  },
  rowText: { flex: 1, gap: 2 },
  toggle: { color: LIGHT.accent, fontSize: 14, fontWeight: '600', paddingVertical: 4 },
});
