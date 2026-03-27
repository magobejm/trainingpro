import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';

const ALL_BLOCK_TYPES: BlockType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'warmup'];

interface AddBlockSectionProps {
  isAdding: boolean;
  onAdd: (type: BlockType) => void;
  onAddWarmupTemplate?: () => void;
  onCancel: () => void;
  t: (k: string) => string;
  types?: BlockType[];
}

export function AddBlockSection({ isAdding, onAdd, onAddWarmupTemplate, onCancel, t, types }: AddBlockSectionProps) {
  if (isAdding) return renderTypeButtons(onAdd, onAddWarmupTemplate, onCancel, t, types ?? ALL_BLOCK_TYPES);
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
  types: BlockType[],
): React.JSX.Element {
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
