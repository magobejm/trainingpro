import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';

interface AddBlockSectionProps {
  isAdding: boolean;
  onAdd: (type: BlockType) => void;
  onAddWarmupTemplate?: () => void;
  onCancel: () => void;
  t: (k: string) => string;
}

export function AddBlockSection({
  isAdding,
  onAdd,
  onAddWarmupTemplate,
  onCancel,
  t,
}: AddBlockSectionProps) {
  if (isAdding) return renderTypeButtons(onAdd, onAddWarmupTemplate, onCancel, t);
  return (
    <Pressable onPress={onCancel} style={s.addBlockBtn}>
      <Text style={s.addBlockText}>{`+ ${t('coach.routine.addBlock')}`}</Text>
    </Pressable>
  );
}

function renderTypeButtons(
  onAdd: (type: BlockType) => void,
  onAddWarmupTemplate: undefined | (() => void),
  onCancel: () => void,
  t: (k: string) => string,
): React.JSX.Element {
  const types: BlockType[] = ['warmup', 'strength', 'cardio', 'plio'];
  return (
    <View style={s.blockTypeRow}>
      {onAddWarmupTemplate ? (
        <Pressable onPress={onAddWarmupTemplate} style={s.blockTypeBtn}>
          <Text style={s.blockTypeBtnText}>{t('coach.routine.blockType.warmupTemplate')}</Text>
        </Pressable>
      ) : null}
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
