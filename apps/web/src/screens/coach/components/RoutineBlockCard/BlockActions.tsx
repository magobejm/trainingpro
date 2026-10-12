import React from 'react';
import { Text, View } from 'react-native';
import { IconButton, colors, fontSize } from '@trainerpro/ui';
import { s } from '../../RoutinePlanner.styles';

interface BlockActionsProps {
  isCollapsed: boolean;
  isEditing: boolean;
  isFirst: boolean;
  isGrouped?: boolean;
  isLast: boolean;
  daysCount: number;
  hasTrainerNote: boolean;
  readOnly: boolean;
  onMove: (d: -1 | 1) => void;
  onOpenNotes: () => void;
  onRemove: () => void;
  onShowMove: () => void;
  onShowDetail?: () => void;
  onToggleCollapse: () => void;
  onToggleEdit: () => void;
  t: (k: string) => string;
}

const ICON_DETAIL = '🔍';
const ICON_EDIT = '✏️';
const ICON_NOTE = '📝';
const ICON_TRASH = '🗑';
const ICON_UP = '↑';
const ICON_DOWN = '↓';
const ICON_EXPANDED = '∨';
const ICON_COLLAPSED = '›';

const glyph = (text: string) => (color: string) => <Text style={{ color, fontSize: fontSize.sm }}>{text}</Text>;
const ACTIVE_STYLE = { backgroundColor: colors.primaryBorder };

export function BlockActions(props: BlockActionsProps) {
  return (
    <View style={s.blockActions}>
      {!props.readOnly && !props.isGrouped && renderMoveButtons(props)}
      {!props.readOnly && !props.isGrouped && <View style={s.blockActionSep} />}
      <IconButton
        accessibilityLabel={props.t('coach.routine.block.trainerNote')}
        icon={glyph(ICON_NOTE)}
        onPress={props.onOpenNotes}
        style={props.hasTrainerNote ? ACTIVE_STYLE : undefined}
      />
      {props.onShowDetail && (
        <IconButton accessibilityLabel={props.t('common.view')} icon={glyph(ICON_DETAIL)} onPress={props.onShowDetail} />
      )}
      {!props.readOnly && (
        <IconButton
          accessibilityLabel={props.t('coach.routine.editMode')}
          icon={glyph(ICON_EDIT)}
          onPress={props.onToggleEdit}
          style={props.isEditing ? ACTIVE_STYLE : undefined}
        />
      )}
      {!props.readOnly && (
        <IconButton
          accessibilityLabel={props.t('coach.routine.block.a11y.remove')}
          icon={glyph(ICON_TRASH)}
          onPress={props.onRemove}
          tone="danger"
        />
      )}
      <IconButton
        accessibilityLabel={props.t(
          props.isCollapsed ? 'coach.routine.block.a11y.expand' : 'coach.routine.block.a11y.collapse',
        )}
        icon={glyph(props.isCollapsed ? ICON_COLLAPSED : ICON_EXPANDED)}
        onPress={props.onToggleCollapse}
      />
    </View>
  );
}

function renderMoveButtons(props: BlockActionsProps) {
  return (
    <>
      <IconButton
        accessibilityLabel={props.t('coach.routine.block.a11y.moveUp')}
        disabled={props.isFirst}
        icon={glyph(ICON_UP)}
        onPress={() => props.onMove(-1)}
        size={28}
      />
      <IconButton
        accessibilityLabel={props.t('coach.routine.block.a11y.moveDown')}
        disabled={props.isLast}
        icon={glyph(ICON_DOWN)}
        onPress={() => props.onMove(1)}
        size={28}
      />
    </>
  );
}
