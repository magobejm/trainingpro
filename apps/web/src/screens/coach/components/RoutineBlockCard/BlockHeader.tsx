import React from 'react';
import { View, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';
import { BlockActions } from './BlockActions';

interface BlockHeaderProps {
  type: BlockType;
  displayName: string;
  importedFromWarmup?: boolean;
  readOnly: boolean;
  onUpdateName: (v: string) => void;
  daysCount: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onShowMove: () => void;
  onShowDetail: () => void;
  t: (k: string) => string;
}

const tagColors: Record<BlockType, { bg: string; text: string }> = {
  cardio: { bg: '#dbeafe', text: '#2563eb' },
  plio: { bg: '#fef3c7', text: '#d97706' },
  sport: { bg: '#f1f5f9', text: '#64748b' },
  strength: { bg: '#f3e8ff', text: '#9333ea' },
  warmup: { bg: '#ecfccb', text: '#16a34a' },
};
const DRAG_HANDLE_ICON = '⠿';

export function BlockHeader(props: BlockHeaderProps) {
  const tagColor = tagColors[props.type] || { bg: '#f1f5f9', text: '#64748b' };
  return (
    <View style={s.blockHeader}>
      <Text style={s.dragHandle}>{DRAG_HANDLE_ICON}</Text>
      <Text numberOfLines={1} style={s.blockName}>
        {props.displayName}
      </Text>
      <View style={[s.blockTag, { backgroundColor: tagColor.bg }]}>
        <Text style={[s.blockTagText, { color: tagColor.text }]}>
          {props.t(`coach.routine.blockType.${props.type}`)}
        </Text>
      </View>
      <WarmupImportedTag imported={props.importedFromWarmup} t={props.t} />
      <BlockActions
        daysCount={props.daysCount}
        isFirst={props.isFirst}
        isLast={props.isLast}
        onMove={props.onMove}
        onRemove={props.onRemove}
        onShowMove={props.onShowMove}
        onShowDetail={props.onShowDetail}
        readOnly={props.readOnly}
      />
    </View>
  );
}

function WarmupImportedTag(props: {
  imported?: boolean;
  t: (k: string) => string;
}): React.JSX.Element | null {
  if (!props.imported) return null;
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{props.t('coach.routine.block.warmupImported')}</Text>
    </View>
  );
}

const styles = {
  tag: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};
