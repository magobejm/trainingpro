import React from 'react';
import { Pressable, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface SaveButtonProps {
  isEditing: boolean;
  onSave: () => void;
  t: (k: string) => string;
}

export function SaveButton({ isEditing, onSave, t }: SaveButtonProps) {
  return (
    <Pressable onPress={onSave} style={s.saveBtn}>
      <Text style={s.saveBtnText}>
        {isEditing ? t('coach.clientProfile.save') : t('coach.routine.save')}
      </Text>
    </Pressable>
  );
}
