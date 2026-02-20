import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type SummaryStripItem = {
  id: string;
  label: string;
  value: string;
};

type Props = {
  items: SummaryStripItem[];
};

const COLORS = {
  border: '#d5deea',
  card: '#ffffff',
  label: '#62748a',
  value: '#0f1b2f',
};

export function SummaryStrip(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {props.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
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
