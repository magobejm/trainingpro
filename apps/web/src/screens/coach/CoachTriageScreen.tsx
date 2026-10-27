import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, colors, fontSize, radius, space, type BadgeTone } from '@trainerpro/ui';
import { NO_WORKOUT_DAYS, RISK_ADHERENCE } from '@trainerpro/shared';
import { useCoachTriage } from '../../data/hooks/useCoachTriage';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import {
  categoryCount,
  openCount,
  TRIAGE_TABS,
  totalOpenCount,
  type Triage,
  type TriageCategoryId,
  type TriageTabId,
} from './coach-triage.sections';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Item = { detail?: string; key: string; name: string; onPress: () => void; tone?: BadgeTone };
type SectionData = { hint?: string; id: TriageCategoryId; items: Item[]; title: string; tone: BadgeTone };

const MAX_ROWS = 6;

export function CoachTriageScreen(props: { onRouteChange: (route: ShellRoute) => void }): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const { collapse, query } = useCoachTriage();
  const [tab, setTab] = React.useState<TriageTabId>('chat');
  const collapsed = query.data?.collapsed ?? [];
  const sections = [
    ...buildSections(query.data, t, i18n.language, props.onRouteChange),
    ...buildPlanSections(query.data, t, props.onRouteChange),
  ];
  const categories = TRIAGE_TABS.find((entry) => entry.id === tab)?.categories ?? [];
  const toggle = (id: TriageCategoryId) =>
    collapse.mutate(collapsed.includes(id) ? collapsed.filter((value) => value !== id) : [...collapsed, id]);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('coach.triage.title')}</Text>
          <Badge label={t('coach.triage.pending', { count: totalOpenCount(query.data, collapsed) })} tone="danger" />
        </View>
        <Text style={styles.subtitle}>{t('coach.triage.subtitle')}</Text>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TRIAGE_TABS.map((entry) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: entry.id === tab }}
            key={entry.id}
            onPress={() => setTab(entry.id)}
            style={[styles.tab, entry.id === tab && styles.tabOn]}
          >
            <Text style={[styles.tabText, entry.id === tab && styles.tabTextOn]}>{t(`coach.triage.tab.${entry.id}`)}</Text>
            <Badge label={String(openCount(query.data, entry.categories, collapsed))} tone="neutral" />
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {categories.map((id) => {
          const section = sections.find((entry) => entry.id === id);
          return section ? (
            <Section
              {...section}
              collapsed={collapsed.includes(id)}
              count={categoryCount(query.data, id)}
              key={id}
              onToggle={() => toggle(id)}
              t={t}
            />
          ) : null;
        })}
      </View>
      {query.isError ? <Text style={styles.error}>{t('coach.triage.error')}</Text> : null}
    </ScrollView>
  );
}

function buildSections(
  data: Triage | undefined,
  t: Translate,
  language: string,
  go: (route: ShellRoute) => void,
): SectionData[] {
  return [
    {
      id: 'chat',
      items: (data?.chat ?? []).map((row) => ({
        detail: t('coach.triage.chatSince', { date: formatSince(row.since, language) }),
        key: row.clientId,
        name: row.name,
        onPress: () => go('coach.chat'),
        tone: 'warning',
      })),
      hint: t('coach.triage.chatHint'),
      title: t('coach.triage.chat'),
      tone: 'danger',
    },
    {
      id: 'incidents',
      items: (data?.incidents ?? []).map((row) => ({
        detail: row.severity,
        key: row.id,
        name: row.name,
        onPress: () => go('coach.incidents'),
        tone: severityTone(row.severity),
      })),
      title: t('coach.triage.incidents'),
      tone: 'warning',
    },
    {
      id: 'calls',
      items: (data?.calls ?? []).map((row) => ({
        detail: row.time,
        key: row.id,
        name: row.name,
        onPress: () => go('coach.calendar'),
      })),
      title: t('coach.triage.calls'),
      tone: 'success',
    },
  ];
}

function buildPlanSections(data: Triage | undefined, t: Translate, go: (route: ShellRoute) => void): SectionData[] {
  const client = (clientId: string) => () => openClient(clientId, go);
  return [
    {
      id: 'mood',
      items: (data?.mood ?? []).map((row) => ({
        detail: moodDetail(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
      })),
      hint: t('coach.triage.moodHint'),
      title: t('coach.triage.mood'),
      tone: 'warning',
    },
    {
      id: 'adherence',
      items: (data?.adherence ?? []).map((row) => ({
        detail: adherenceDetail(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
      })),
      hint: t('coach.triage.adherenceHint', { days: NO_WORKOUT_DAYS, percent: Math.round(RISK_ADHERENCE * 100) }),
      title: t('coach.triage.adherenceTitle'),
      tone: 'danger',
    },
    {
      id: 'reports',
      items: (data?.reports ?? []).map((row) => ({
        detail: row.weekStart,
        key: row.id,
        name: row.name,
        onPress: client(row.clientId),
      })),
      title: t('coach.triage.reports'),
      tone: 'primary',
    },
    {
      id: 'wearables',
      items: (data?.wearableSignals ?? []).map((row) => ({
        detail: wearableDetail(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
      })),
      title: t('coach.triage.wearables'),
      tone: 'warning',
    },
    {
      id: 'routines',
      items: (data?.routines ?? []).map((row) => ({
        detail: routineLabel(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
        tone: row.kind === 'noRoutine' ? 'danger' : row.kind === 'noCalendar' ? 'warning' : 'info',
      })),
      hint: t('coach.triage.routinesHint'),
      title: t('coach.triage.routines'),
      tone: 'warning',
    },
    {
      id: 'nutrition',
      items: (data?.nutrition ?? []).map((row) => ({
        detail: t('coach.triage.noNutrition'),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
        tone: 'warning',
      })),
      hint: t('coach.triage.nutritionHint'),
      title: t('coach.triage.nutrition'),
      tone: 'warning',
    },
  ];
}

function formatSince(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language, { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' });
}

function routineLabel(row: Triage['routines'][number], t: Translate): string {
  if (row.kind === 'noRoutine') return t('coach.triage.noRoutine');
  if (row.kind === 'noCalendar') return t('coach.triage.noCalendar');
  return t('coach.triage.daysLeft', { count: row.daysLeft ?? 0 });
}

function adherenceDetail(row: Triage['adherence'][number], t: Translate): string {
  const parts: string[] = [];
  if (row.weekAdherence != null && row.weekAdherence < RISK_ADHERENCE) {
    parts.push(t('coach.triage.adherence', { value: Math.round(row.weekAdherence * 100) }));
  }
  if (row.daysWithoutWorkout != null && row.daysWithoutWorkout >= NO_WORKOUT_DAYS) {
    parts.push(t('coach.triage.noWorkout', { days: row.daysWithoutWorkout }));
  }
  return parts.join(' · ');
}

function moodDetail(row: Triage['mood'][number], t: Translate): string {
  const values: Record<string, number | null> = {
    motivation: row.motivation,
    pain: row.pain,
    recovery: row.recovery,
    sleep: row.sleep,
  };
  return row.fields.map((field) => `${t(`coach.triage.field.${field}`)} ${values[field] ?? '-'}/5`).join(' · ');
}

function wearableDetail(row: { hrvMs: number | null; sleepMinutes: number | null }, t: Translate): string {
  const parts: string[] = [];
  if (row.sleepMinutes !== null) parts.push(t('coach.triage.sleep', { hours: (row.sleepMinutes / 60).toFixed(1) }));
  if (row.hrvMs !== null) parts.push(t('coach.triage.hrv', { value: Math.round(row.hrvMs) }));
  return parts.join(' · ');
}

function severityTone(severity: string): BadgeTone {
  const value = severity.toLowerCase();
  return value.includes('crit') || value.includes('high') || value.includes('alta') ? 'danger' : 'warning';
}

function openClient(clientId: string, onRouteChange: (route: ShellRoute) => void): void {
  window.history.pushState({}, '', `/coach/clients/${clientId}`);
  onRouteChange('coach.clients');
}

function Section(
  props: SectionData & { collapsed: boolean; count: number; onToggle: () => void; t: Translate },
): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? props.items : props.items.slice(0, MAX_ROWS);
  const hidden = props.items.length - MAX_ROWS;
  const toggleKey = expanded ? 'coach.triage.less' : 'coach.triage.more';
  const EyeIcon = props.collapsed ? EyeOff : Eye;
  const eyeLabel = props.t(props.collapsed ? 'coach.triage.show' : 'coach.triage.fold', { title: props.title });
  return (
    <View style={[styles.card, props.collapsed && styles.cardFolded]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.heading, props.collapsed && styles.muted]}>{props.title}</Text>
        <Badge label={String(props.count)} tone={props.collapsed || props.count === 0 ? 'neutral' : props.tone} />
        <Pressable accessibilityLabel={eyeLabel} accessibilityRole="button" onPress={props.onToggle} style={styles.eye}>
          <EyeIcon color={colors.textMuted} size={16} />
        </Pressable>
      </View>
      {props.collapsed ? (
        <Text style={styles.hint}>{props.t('coach.triage.folded')}</Text>
      ) : (
        <>
          {props.hint ? <Text style={styles.hint}>{props.hint}</Text> : null}
          {props.items.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyMark}>{'✓'}</Text>
              <Text style={styles.muted}>{props.t('coach.triage.empty')}</Text>
            </View>
          ) : (
            visible.map((item) => <Row item={item} key={item.key} />)
          )}
          {hidden > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)}>
              <Text style={styles.toggle}>{props.t(toggleKey, { count: hidden })}</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

function Row(props: { item: Item }): React.JSX.Element {
  const { item } = props;
  return (
    <Pressable accessibilityRole="button" onPress={item.onPress} style={styles.row}>
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        {item.detail && !item.tone ? <Text style={styles.detail}>{item.detail}</Text> : null}
      </View>
      {item.detail && item.tone ? <Badge label={item.detail} tone={item.tone} /> : null}
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

const styles = {
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: 320,
    flexGrow: 1,
    gap: space.xs,
    padding: space.lg,
  },
  cardFolded: { backgroundColor: colors.surfaceMuted, borderStyle: 'dashed' },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xs,
  },
  chevron: { color: colors.textMuted, fontSize: fontSize.lg },
  detail: { color: colors.textMuted, fontSize: fontSize.xs },
  emptyMark: { color: colors.success, fontSize: fontSize.md, fontWeight: '700' },
  emptyRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: space.md },
  eye: { alignItems: 'center', borderRadius: radius.md, height: 28, justifyContent: 'center', width: 28 },
  grid: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  header: { gap: space.xs, marginBottom: space.md },
  heading: { color: colors.text, flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: space.xs },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  name: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  page: { padding: space.lg },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  rowText: { flex: 1, gap: 2 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  tabOn: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm },
  tabTextOn: { color: colors.primary, fontWeight: '700' },
  tabs: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: space.md,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  toggle: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600', paddingVertical: space.xs },
} as const;
