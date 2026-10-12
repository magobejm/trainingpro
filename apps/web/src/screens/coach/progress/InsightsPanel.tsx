import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, colors, fontSize, space } from '@trainerpro/ui';
import { buildInsights } from './build-insights';
import type { AnalysisMode } from './progress-screen.types';
export function InsightsPanel({
  mode,
  points,
  t,
}: {
  mode: AnalysisMode;
  points: Record<string, unknown>[];
  t: (key: string) => string;
}): React.JSX.Element | null {
  const insights = buildInsights(mode, points);
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
