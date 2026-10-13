import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, colors, fontSize, space } from '@trainerpro/ui';
import { buildInsights, recordInsights } from './build-insights';
import { recentRecordRange, useClientRecordsQuery } from '../../../data/hooks/useClientRecordsQuery';
import type { AnalysisMode } from './progress-screen.types';
export function InsightsPanel({
  clientId,
  mode,
  points,
  t,
}: {
  clientId?: string;
  mode: AnalysisMode;
  points: Record<string, unknown>[];
  t: (key: string, options?: Record<string, number | string>) => string;
}): React.JSX.Element | null {
  const range = recentRecordRange(14);
  const records = useClientRecordsQuery(clientId ?? '', range.from, range.to).data?.records ?? [];
  const insights = [...recordInsights(records, t), ...buildInsights(mode, points)];
  if (!insights.length) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{t('coach.progress.insight.title')}</Text>
      {insights.map((item, index) => (
        <Card key={index} style={insightCardStyle(item.color)}>
          <Text style={styles.text}>
            {item.emoji} {item.text}
          </Text>
        </Card>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: space.md },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  card: { borderLeftWidth: space.xs, backgroundColor: colors.surfaceMuted },
  text: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
});

function insightCardStyle(color: string) {
  return [styles.card, StyleSheet.create({ accent: { borderLeftColor: color } }).accent];
}
