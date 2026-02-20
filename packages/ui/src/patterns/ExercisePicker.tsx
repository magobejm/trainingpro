import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ExerciseOption = {
  id: string;
  subtitle: string;
  title: string;
};

type Props = {
  emptyLabel: string;
  items: ExerciseOption[];
  onPick: (id: string) => void;
  pickLabel: string;
};

const COLORS = {
  border: '#d8e1ee',
  text: '#11213a',
  muted: '#5f7288',
  action: '#225fdb',
  white: '#ffffff',
};

export function ExercisePicker(props: Props): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.emptyLabel}</Text>;
  }
  return (
    <View style={styles.list}>
      {props.items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.meta}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Pressable onPress={() => props.onPick(item.id)} style={styles.action}>
            <Text style={styles.actionLabel}>{props.pickLabel}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  actionLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 13,
  },
  item: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  list: {
    gap: 8,
  },
  meta: {
    flex: 1,
    gap: 3,
    marginRight: 10,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
