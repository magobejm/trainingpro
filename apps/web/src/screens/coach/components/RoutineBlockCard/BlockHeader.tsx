import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { BlockType } from '../../RoutinePlanner.types';
import { BlockActions } from './BlockActions';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

interface BlockHeaderProps {
  type: BlockType;
  displayName: string;
  importedFromWarmup?: boolean;
  isCollapsed: boolean;
  isEditing: boolean;
  isGrouped?: boolean;
  readOnly: boolean;
  onUpdateName: (v: string) => void;
  daysCount: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onShowMove: () => void;
  onShowDetail: () => void;
  onOpenNotes: () => void;
  hasTrainerNote: boolean;
  onToggleCollapse: () => void;
  onToggleEdit: () => void;
  t: (k: string) => string;
}

const tagColors: Record<BlockType, { bg: string; text: string }> = {
  cardio: { bg: colors.primaryBorder, text: colors.primary },
  isometric: { bg: 'var(--tp-chartPinkSoft)', text: 'var(--tp-chartPink)' },
  plio: { bg: colors.warningSoft, text: colors.warning },
  sport: { bg: colors.background, text: colors.textMuted },
  strength: { bg: 'var(--tp-chartPurpleSoft)', text: 'var(--tp-chartPurple)' },
  mobility: { bg: 'var(--tp-successSoft)', text: colors.success },
};
const DRAG_HANDLE_ICON = '⠿';

export function BlockHeader(props: BlockHeaderProps) {
  const tagColor = tagColors[props.type] || { bg: colors.background, text: colors.textMuted };
  return (
    <View style={s.blockHeader}>
      {/* eslint-disable-next-line no-restricted-syntax */}
      <Pressable
        onPress={props.onToggleCollapse}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: space.md, cursor: 'pointer' } as never}
      >
        <Text style={s.dragHandle}>{DRAG_HANDLE_ICON}</Text>
        <Text numberOfLines={1} style={s.blockName}>
          {props.displayName}
        </Text>
        <View style={[s.blockTag, { backgroundColor: tagColor.bg }]}>
          <Text style={[s.blockTagText, { color: tagColor.text }]}>{props.t(`coach.routine.blockType.${props.type}`)}</Text>
        </View>
        <WarmupImportedTag imported={props.importedFromWarmup} t={props.t} />
      </Pressable>
      <BlockActions
        daysCount={props.daysCount}
        hasTrainerNote={props.hasTrainerNote}
        isCollapsed={props.isCollapsed}
        isEditing={props.isEditing}
        isFirst={props.isFirst}
        isGrouped={props.isGrouped}
        isLast={props.isLast}
        onMove={props.onMove}
        onOpenNotes={props.onOpenNotes}
        onRemove={props.onRemove}
        onShowMove={props.onShowMove}
        onShowDetail={props.onShowDetail}
        onToggleCollapse={props.onToggleCollapse}
        onToggleEdit={props.onToggleEdit}
        readOnly={props.readOnly}
        t={props.t}
      />
    </View>
  );
}

function WarmupImportedTag(props: { imported?: boolean; t: (k: string) => string }): React.JSX.Element | null {
  if (!props.imported) return null;
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{props.t('coach.routine.block.warmupImported')}</Text>
    </View>
  );
}

const styles = {
  tag: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    marginRight: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  tagText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};
