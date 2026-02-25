import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';

interface RoutineNameInputProps {
  name: string;
  isReadOnly: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (k: string) => string;
}

export function RoutineNameInput({ name, isReadOnly, setDraft, t }: RoutineNameInputProps) {
  return (
    <View style={s.card}>
      <Text style={s.label}>{t('coach.routine.name')}</Text>
      <TextInput
        editable={!isReadOnly}
        onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder={t('coach.routine.namePlaceholder')}
        style={[s.input, isReadOnly && { backgroundColor: '#f8fafc' }]}
        value={name}
      />
    </View>
  );
}
