/* eslint-disable no-restricted-syntax */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { SessionView } from '../../data/hooks/useTodaySession';

export type SessionSetRowProps = {
  item: SessionView['items'][0];
  onLogSet: (
    sessionItemId: string,
    setIndex: number,
    repsDone: number | null,
    effortRpe: number | null,
    weightDoneKg: number | null,
  ) => void;
  setIndex: number;
};

export function SessionSetRow({ item, onLogSet, setIndex }: SessionSetRowProps) {
  const { isDone, repsStr, setRepsStr, setWeightStr, weightStr } = useSetRowState(item, setIndex);

  return (
    <View style={[styles.setRow, isDone && styles.setRowDone]}>
      <Text style={styles.setColText}>{setIndex}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={setWeightStr}
        style={styles.setColInput}
        value={weightStr}
      />
      <TextInput
        keyboardType="numeric"
        onChangeText={setRepsStr}
        style={styles.setColInput}
        value={repsStr}
      />
      <Pressable
        onPress={() => handleToggle(item, setIndex, weightStr, repsStr, onLogSet)}
        style={[styles.checkBtn, isDone && styles.checkBtnDone]}
      >
        <Text style={styles.checkBtnLabel}>{'✓'}</Text>
      </Pressable>
    </View>
  );
}

function handleToggle(
  item: SessionSetRowProps['item'],
  setIndex: number,
  weightStr: string,
  repsStr: string,
  onLogSet: SessionSetRowProps['onLogSet'],
) {
  const w = weightStr ? Number(weightStr) : null;
  const r = repsStr ? Number(repsStr) : null;
  onLogSet(item.id, setIndex, r, null, w);
}

function useSetRowState(item: SessionSetRowProps['item'], setIndex: number) {
  const existingLog = item.logs.find((L) => L.setIndex === setIndex);
  const isDone = Boolean(existingLog);
  const defaultReps = item.repsMax ?? item.repsMin ?? '';
  const [weightStr, setWeightStr] = useState(existingLog?.weightDoneKg?.toString() ?? '');
  const [repsStr, setRepsStr] = useState(
    existingLog?.repsDone?.toString() ?? defaultReps.toString(),
  );
  return { isDone, repsStr, setRepsStr, setWeightStr, weightStr };
}

const styles = StyleSheet.create({
  checkBtn: {
    alignItems: 'center',
    backgroundColor: '#e6edf5',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  checkBtnDone: {
    backgroundColor: '#34c759',
  },
  checkBtnLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  setColInput: {
    backgroundColor: '#f3f7fb',
    borderRadius: 8,
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 34,
    padding: 0,
    textAlign: 'center',
  },
  setColText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  setRowDone: {
    opacity: 0.6,
  },
});
