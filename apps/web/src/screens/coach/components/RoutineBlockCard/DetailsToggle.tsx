import React from 'react';
import { Pressable, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface DetailsToggleProps {
  show: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}

export function DetailsToggle({ show, onToggle, t }: DetailsToggleProps) {
  const label = show ? t('coach.routine.hideDetails') : t('coach.routine.showDetails');
  return (
    <Pressable onPress={onToggle} style={s.moveBtn}>
      <Text style={s.moveBtnText}>{label}</Text>
    </Pressable>
  );
}
