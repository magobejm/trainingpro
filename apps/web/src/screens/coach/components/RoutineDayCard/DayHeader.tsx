import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface DayHeaderProps {
  title: string;
  readOnly: boolean;
  daysCount: number;
  onRename: (v: string) => void;
  onRemove: () => void;
  t: (k: string) => string;
}

export function DayHeader({ title, readOnly, daysCount, onRename, onRemove, t }: DayHeaderProps) {
  return (
    <View style={s.dayHeader}>
      <TextInput
        editable={!readOnly}
        onChangeText={onRename}
        placeholder={t('coach.routine.dayTitlePlaceholder')}
        style={[s.input, { flex: 1 }, readOnly && { backgroundColor: '#f8fafc' }]}
        value={title}
      />
      {!readOnly && daysCount > 1 && (
        <Pressable onPress={onRemove} style={s.deleteDayBtn}>
          <Text style={s.deleteDayText}>{t('coach.routine.deleteDay')}</Text>
        </Pressable>
      )}
    </View>
  );
}
