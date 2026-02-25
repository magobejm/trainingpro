import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface DayTabsProps {
  days: { id: string; title: string }[];
  activeIdx: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  readOnly: boolean;
  t: (k: string) => string;
}

export function DayTabs({ days, activeIdx, onSelect, onAdd, readOnly, t }: DayTabsProps) {
  return (
    <View style={s.dayTabRow}>
      {days.map((day, idx) => (
        <Pressable
          key={day.id}
          onPress={() => onSelect(idx)}
          style={[s.dayTab, idx === activeIdx && s.dayTabActive]}
        >
          <Text style={[s.dayTabText, idx === activeIdx && s.dayTabTextActive]}>{day.title}</Text>
        </Pressable>
      ))}
      {!readOnly && (
        <Pressable onPress={onAdd} style={s.addDayBtn}>
          <Text style={s.addDayText}>{`+ ${t('coach.routine.addDay')}`}</Text>
        </Pressable>
      )}
    </View>
  );
}
