import React from 'react';
import { TextInput, View, Text, Pressable } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';
import { BlockActions } from './BlockActions';

interface BlockHeaderProps {
  type: BlockType;
  displayName: string;
  readOnly: boolean;
  onUpdateName: (v: string) => void;
  daysCount: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onShowMove: () => void;
  onShowDetail: () => void;
}

const typeEmoji: Record<BlockType, string> = {
  cardio: '🏃',
  plio: '🪂',
  sport: '⚽',
  strength: '🏋️',
  warmup: '🤸',
};

export function BlockHeader(props: BlockHeaderProps) {
  return (
    <View style={s.blockHeader}>
      <Text style={s.blockEmoji}>{typeEmoji[props.type]}</Text>
      <TextInput
        editable={!props.readOnly}
        onChangeText={props.onUpdateName}
        style={[s.input, { flex: 1 }, props.readOnly && { backgroundColor: '#f8fafc' }]}
        value={props.displayName}
      />
      <Pressable accessibilityLabel="view-details" onPress={props.onShowDetail} style={s.moveBtn}>
        <Text style={s.moveBtnText}>{'\uD83D\uDD0D'}</Text>
      </Pressable>
      {!props.readOnly && (
        <BlockActions
          daysCount={props.daysCount}
          isFirst={props.isFirst}
          isLast={props.isLast}
          onMove={props.onMove}
          onRemove={props.onRemove}
          onShowMove={props.onShowMove}
        />
      )}
    </View>
  );
}
