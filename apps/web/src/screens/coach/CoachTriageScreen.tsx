import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, colors, fontSize, radius, space, type BadgeTone } from '@trainerpro/ui';
import { RISK_ADHERENCE, RISK_INACTIVE_DAYS } from '@trainerpro/shared';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';

type Triage = {
  atRisk: Array<{ adherence?: number | null; clientId: string; inactiveDays: number | null; name: string }>;
  calls: Array<{ clientId: string; id: string; name: string; status: string; time: string }>;
  checkins: Array<{ clientId: string; fatigue: number; name: string; pain: number | null }>;
  incidents: Array<{ clientId: string; id: string; name: string; severity: string }>;
  reports: Array<{ clientId: string; id: string; name: string; weekStart: string }>;
  wearableSignals?: Array<{ clientId: string; hrvMs: number | null; name: string; sleepMinutes: number | null }>;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Item = { detail?: string; key: string; name: string; onPress: () => void; tone?: BadgeTone };

const MAX_ROWS = 6;

export function CoachTriageScreen(props: { onRouteChange: (route: ShellRoute) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const query = useQuery({
    enabled: Boolean(accessToken && activeRole),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' }).get<Triage>('/coach/triage'),
    queryKey: ['coach', 'triage', accessToken],
  });
  const sections = buildSections(query.data, t, props.onRouteChange);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('coach.triage.title')}</Text>
        <Text style={styles.subtitle}>{t('coach.triage.subtitle')}</Text>
      </View>
      <View style={styles.grid}>
        {sections.map((section) => (
          <Section empty={t('coach.triage.empty')} key={section.title} more={t} {...section} />
        ))}
      </View>
      {query.isError ? <Text style={styles.error}>{t('coach.triage.error')}</Text> : null}
    </ScrollView>
  );
}

type SectionData = { hint?: string; items: Item[]; title: string; tone: BadgeTone };

function buildSections(data: Triage | undefined, t: Translate, go: (route: ShellRoute) => void): SectionData[] {
  const client = (clientId: string) => () => openClient(clientId, go);
  return [
    {
      items: (data?.atRisk ?? []).map((row) => ({
        detail: riskDetail(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
      })),
      hint: t('coach.triage.riskHint', { days: RISK_INACTIVE_DAYS, percent: Math.round(RISK_ADHERENCE * 100) }),
      title: t('coach.triage.risk'),
      tone: 'danger',
    },
    {
      items: (data?.checkins ?? []).map((row) => ({
        detail: checkinDetail(row, t),
        key: row.clientId,
        name: row.name,
        onPress: client(row.clientId),
      })),
      title: t('coach.triage.checkins'),
      tone: 'info',
    },
    {
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

function riskDetail(row: { adherence?: number | null; inactiveDays: number | null }, t: Translate): string {
  const inactive =
    row.inactiveDays === null ? t('coach.triage.noActivity') : t('coach.triage.inactive', { days: row.inactiveDays });
  const lowAdherence = row.adherence != null && row.adherence < RISK_ADHERENCE;
  if (!lowAdherence || row.adherence == null) return inactive;
  return `${inactive} · ${t('coach.triage.adherence', { value: Math.round(row.adherence * 100) })}`;
}

function checkinDetail(row: { fatigue: number; pain: number | null }, t: Translate): string {
  const fatigue = t('coach.triage.fatigue', { value: row.fatigue });
  return row.pain === null ? fatigue : `${fatigue} · ${t('coach.triage.pain', { value: row.pain })}`;
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

function Section(props: SectionData & { empty: string; more: Translate }): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? props.items : props.items.slice(0, MAX_ROWS);
  const hidden = props.items.length - MAX_ROWS;
  const toggleKey = expanded ? 'coach.triage.less' : 'coach.triage.more';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.heading}>{props.title}</Text>
        <Badge label={String(props.items.length)} tone={props.items.length === 0 ? 'neutral' : props.tone} />
      </View>
      {props.hint ? <Text style={styles.hint}>{props.hint}</Text> : null}
      {props.items.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyMark}>{'✓'}</Text>
          <Text style={styles.muted}>{props.empty}</Text>
        </View>
      ) : (
        visible.map((item) => <Row item={item} key={item.key} />)
      )}
      {hidden > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)}>
          <Text style={styles.toggle}>{props.more(toggleKey, { count: hidden })}</Text>
        </Pressable>
      ) : null}
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
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  chevron: { color: colors.textMuted, fontSize: fontSize.lg },
  detail: { color: colors.textMuted, fontSize: fontSize.xs },
  emptyMark: { color: colors.success, fontSize: fontSize.md, fontWeight: '700' },
  emptyRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  header: { gap: space.xs, marginBottom: space.lg },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
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
  hint: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: space.xs },
  rowText: { flex: 1, gap: 2 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  toggle: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600', paddingVertical: space.xs },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
} as const;
