import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';

interface AddBlockSectionProps {
  isAdding: boolean;
  onAdd: (type: BlockType) => void;
  onCancel: () => void;
  t: (k: string) => string;
}

export function AddBlockSection({ isAdding, onAdd, onCancel, t }: AddBlockSectionProps) {
  const types: BlockType[] = ['warmup', 'strength', 'cardio', 'plio', 'sport'];
  if (isAdding) {
    return (
      <View style={s.blockTypeRow}>
        {types.map((bt) => (
          <Pressable key={bt} onPress={() => onAdd(bt)} style={s.blockTypeBtn}>
            <Text style={s.blockTypeBtnText}>{t(`coach.routine.blockType.${bt}`)}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onCancel} style={[s.blockTypeBtn, { backgroundColor: '#64748b' }]}>
          <Text style={s.blockTypeBtnText}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable onPress={onCancel} style={s.addBlockBtn}>
      <Text style={s.addBlockText}>{`+ ${t('coach.routine.addBlock')}`}</Text>
    </Pressable>
  );
}
