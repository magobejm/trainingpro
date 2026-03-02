import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';

interface RoutineNameInputProps {
  name: string;
  isReadOnly: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (k: string) => string;
  labelKey?: string;
  placeholderKey?: string;
}

export function RoutineNameInput({
  name,
  isReadOnly,
  setDraft,
  t,
  labelKey = 'coach.routine.name',
  placeholderKey = 'coach.routine.namePlaceholder',
}: RoutineNameInputProps) {
  return (
    <View style={s.card}>
      <Text style={s.label}>{t(labelKey)}</Text>
      <TextInput
        editable={!isReadOnly}
        onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder={t(placeholderKey)}
        style={[s.input, isReadOnly && { backgroundColor: '#f8fafc' }]}
        value={name}
      />
    </View>
  );
}
