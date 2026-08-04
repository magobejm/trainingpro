import React from 'react';
import { Pressable, Text, View } from 'react-native';
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

export function BlockActions(props: BlockActionsProps) {
  return (
    <View style={s.blockActions}>
      {!props.readOnly && !props.isGrouped && renderMoveButtons(props)}
      {!props.readOnly && !props.isGrouped && <View style={s.blockActionSep} />}
      <Pressable
        accessibilityLabel={props.t('coach.routine.block.trainerNote')}
        onPress={props.onOpenNotes}
        style={[s.viewDetailBtn, props.hasTrainerNote && s.blockEditBtnActive]}
      >
        <Text style={s.viewDetailBtnText}>{ICON_NOTE}</Text>
      </Pressable>
      {props.onShowDetail && (
        <Pressable onPress={props.onShowDetail} style={s.viewDetailBtn}>
          <Text style={s.viewDetailBtnText}>{ICON_DETAIL}</Text>
        </Pressable>
      )}
      {!props.readOnly && (
        <Pressable onPress={props.onToggleEdit} style={[s.blockEditBtn, props.isEditing && s.blockEditBtnActive]}>
          <Text style={s.blockEditBtnText}>{ICON_EDIT}</Text>
        </Pressable>
      )}
      {!props.readOnly && (
        <Pressable onPress={props.onRemove} style={s.blockTrashBtn}>
          <Text style={s.blockTrashBtnText}>{ICON_TRASH}</Text>
        </Pressable>
      )}
      <Pressable onPress={props.onToggleCollapse} style={s.blockCollapseBtn}>
        <Text style={s.blockCollapseBtnText}>{props.isCollapsed ? ICON_COLLAPSED : ICON_EXPANDED}</Text>
      </Pressable>
    </View>
  );
}

function renderMoveButtons(props: BlockActionsProps) {
  return (
    <>
      <Pressable
        disabled={props.isFirst}
        onPress={() => props.onMove(-1)}
        style={[s.moveBtn, props.isFirst && { opacity: 0.35 }]}
      >
        <Text style={s.moveBtnText}>{ICON_UP}</Text>
      </Pressable>
      <Pressable
        disabled={props.isLast}
        onPress={() => props.onMove(1)}
        style={[s.moveBtn, props.isLast && { opacity: 0.35 }]}
      >
        <Text style={s.moveBtnText}>{ICON_DOWN}</Text>
      </Pressable>
    </>
  );
}
