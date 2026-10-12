import React from 'react';
import { View } from 'react-native';
import { TextField } from '@trainerpro/ui';
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
      <TextField
        disabled={isReadOnly}
        label={t(labelKey)}
        onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder={t(placeholderKey)}
        value={name}
      />
    </View>
  );
}
