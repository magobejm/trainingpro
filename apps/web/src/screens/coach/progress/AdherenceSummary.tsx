import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, colors, fontSize, radius, space } from '@trainerpro/ui';
import { useAdherenceQuery, type AdherenceResult } from '../../../data/hooks/useAdherenceQuery';

type Translate = (key: string, options?: Record<string, string | number>) => string;
const OUTCOMES = ['done', 'incomplete', 'skipped', 'pending', 'in_progress'] as const;
const OUTCOME_COLORS = {
  done: colors.success,
  incomplete: colors.warning,
  skipped: colors.danger,
  pending: colors.textMuted,
  in_progress: colors.info,
};
export function AdherenceSummary(props: {
  clientId: string;
  from: string;
  to: string;
  templateId?: string | null;
  t: Translate;
}) {
  const query = useAdherenceQuery(props);
  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {props.t('training.adherence.title')}
        </Text>
        {query.data ? (
          <Text style={styles.cutoff}>{props.t('training.adherence.cutoff', { cutoff: query.data.cutoffDate })}</Text>
        ) : null}
      </View>
      {query.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {props.t('coach.progress.error')}
        </Text>
      ) : query.data ? (
        <AdherenceContent result={query.data} t={props.t} />
      ) : (
        <Text style={styles.note}>{props.t('coach.progress.loading')}</Text>
      )}
    </Card>
  );
}

function AdherenceContent({ result, t }: { result: AdherenceResult; t: Translate }) {
  return (
    <View style={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.percent}>{result.percent == null ? '—' : `${Math.round(result.percent * 10) / 10}%`}</Text>
        <Text style={styles.ratio}>
          {result.percent == null
            ? t('training.adherence.empty')
            : t('training.adherence.ratio', {
                done: result.counts.done,
                planned: result.plannedCount,
              })}
        </Text>
      </View>
      {result.percent != null ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('training.adherence.title')}
          accessibilityValue={{ min: 0, max: 100, now: result.percent }}
          style={styles.bar}
        >
          {OUTCOMES.filter((outcome) => result.counts[outcome] > 0).map((outcome) => (
            <View
              key={outcome}
              style={{ flexBasis: 0, flexGrow: result.counts[outcome], backgroundColor: OUTCOME_COLORS[outcome] }}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.breakdown}>
        {OUTCOMES.map((outcome) => (
          <View key={outcome} style={styles.stat}>
            <Text style={styles.count}>{result.counts[outcome]}</Text>
            <View style={styles.statLabel}>
              <View style={[styles.dot, { backgroundColor: OUTCOME_COLORS[outcome] }]} />
              <Text style={styles.label}>{t('training.outcome.' + outcome)}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.note}>{t('training.adherence.criteria')}</Text>
        <Text style={styles.note}>{t('training.adherence.unplanned', { count: result.unplannedSessionsCount })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  cutoff: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
  content: { gap: space.lg },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
  percent: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '800', lineHeight: 44 },
  ratio: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 21, flexBasis: 200, flexGrow: 1 },
  bar: { flexDirection: 'row', height: 8, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
    flexBasis: 120,
    flexGrow: 1,
  },
  count: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  label: { color: colors.textMuted, fontSize: fontSize.xs, flexShrink: 1 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, gap: space.xs },
  note: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
