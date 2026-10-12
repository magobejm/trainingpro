import React from 'react';
import { View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';
import { Button } from '@trainerpro/ui';

const ALL_BLOCK_TYPES: BlockType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'mobility'];

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
  return <Button label={`+ ${t('coach.routine.addBlock')}`} onPress={onCancel} style={s.addBlockBtn} variant="secondary" />;
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
        <Button key={bt} label={t(`coach.routine.blockType.${bt}`)} onPress={() => onAdd(bt)} size="sm" />
      ))}
      <Button label={t('common.cancel')} onPress={onCancel} size="sm" variant="secondary" />
    </View>
  );
}
