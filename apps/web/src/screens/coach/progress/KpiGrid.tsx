import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, colors, CountUpText, fontSize, space } from '@trainerpro/ui';
type Kpi = { id: string; label: string; value: string };
export function KpiGrid({ items, t }: { items: Kpi[]; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Text style={styles.label}>{t(item.label)}</Text>
          <CountUpText style={styles.value} value={item.value} />
        </Card>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  card: { flexGrow: 1, flexBasis: 160, gap: space.sm },
  label: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  value: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
});
