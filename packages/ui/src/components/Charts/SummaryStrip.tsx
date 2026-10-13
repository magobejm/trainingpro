import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CountUpText } from '../../primitives/CountUpText';
import { colors } from '../../theme/tokens';

export type SummaryStripItem = {
  id: string;
  label: string;
  value: string;
};

type Props = {
  items: SummaryStripItem[];
};

const COLORS = {
  border: colors.border,
  card: colors.surface,
  label: colors.textMuted,
  value: colors.text,
};

export function SummaryStrip(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {props.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <CountUpText style={styles.value} value={item.value} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 72,
    padding: 10,
  },
  label: {
    color: COLORS.label,
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  value: {
    color: COLORS.value,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
});
