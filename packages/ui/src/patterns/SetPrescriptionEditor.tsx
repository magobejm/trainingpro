import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export type SetRange = {
  maxKg: string;
  minKg: string;
};

type Props = {
  addLabel: string;
  maxLabel: string;
  minLabel: string;
  onAddSet: () => void;
  onChangeRange: (index: number, next: SetRange) => void;
  ranges: SetRange[];
  removeLabel: string;
};

const COLORS = {
  border: '#d8e1ee',
  danger: '#c1372f',
  muted: '#5f7288',
  text: '#11213a',
};

export function SetPrescriptionEditor(props: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      {props.ranges.map((range, index) => (
        <View key={index} style={styles.row}>
          <Field
            label={props.minLabel}
            onChange={(value) => props.onChangeRange(index, { ...range, minKg: value })}
            value={range.minKg}
          />
          <Field
            label={props.maxLabel}
            onChange={(value) => props.onChangeRange(index, { ...range, maxKg: value })}
            value={range.maxKg}
          />
          <Pressable onPress={() => props.onChangeRange(index, { maxKg: '', minKg: '' })}>
            <Text style={styles.remove}>{props.removeLabel}</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={props.onAddSet} style={styles.add}>
        <Text style={styles.addLabel}>{props.addLabel}</Text>
      </Pressable>
    </View>
  );
}

function Field(props: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={props.onChange}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 140,
  },
  addLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    gap: 10,
  },
  field: {
    gap: 4,
    width: 90,
  },
  fieldLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  input: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  remove: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
});
