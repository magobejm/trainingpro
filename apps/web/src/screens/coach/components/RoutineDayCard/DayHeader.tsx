import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

const PLACEHOLDER_COLOR = '#94a3b8';
const ICON_OPEN = '∨';
const ICON_CLOSED = '›';
const ICON_UP = '↑';
const ICON_DOWN = '↓';
const ICON_TRASH = '🗑';

interface DayHeaderProps {
  blockCount: number;
  dayNumber: number;
  daysCount: number;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  title: string;
  onAddBlock: () => void;
  onMoveDay: (dir: -1 | 1) => void;
  onRemove: () => void;
  onRename: (v: string) => void;
  onToggleCollapse: () => void;
  t: (k: string, options?: Record<string, unknown>) => string;
  addExerciseLabelKey?: string;
  sessionPlaceholderKey?: string;
}

export function DayHeader(props: DayHeaderProps): React.JSX.Element {
  const addKey = props.addExerciseLabelKey ?? 'coach.routine.addExercise';
  const placeholderKey = props.sessionPlaceholderKey ?? 'coach.routine.sessionNamePlaceholder';
  const dayLabel = `Día ${props.dayNumber}`;
  const badge = String(props.dayNumber).padStart(2, '0');
  return (
    <View style={s.dayCardHeaderRow}>
      <Pressable onPress={props.onToggleCollapse} style={s.dayCollapseBtn}>
        <Text style={s.dayCollapseBtnText}>{props.isCollapsed ? ICON_CLOSED : ICON_OPEN}</Text>
      </Pressable>
      <View style={s.dayNumberBadge}>
        <Text style={s.dayNumberBadgeText}>{badge}</Text>
      </View>
      <View style={s.dayTitleBlock}>
        <Text style={s.dayTitleMain}>{dayLabel}</Text>
        <Text style={s.dayTitleSub}>{props.t('coach.routine.exercisesAdded', { count: props.blockCount })}</Text>
      </View>
      <TextInput
        editable={!props.readOnly}
        onChangeText={props.onRename}
        placeholder={props.t(placeholderKey)}
        placeholderTextColor={PLACEHOLDER_COLOR}
        style={s.daySessionInput}
        value={props.title}
      />
      <View style={s.dayHeaderRight}>
        {!props.readOnly && (
          <Pressable onPress={props.onAddBlock} style={s.dayAddExerciseBtn}>
            <Text style={s.dayAddExerciseBtnText}>{props.t(addKey)}</Text>
          </Pressable>
        )}
        {!props.readOnly && (
          <>
            <Pressable
              disabled={props.isFirst}
              onPress={() => props.onMoveDay(-1)}
              style={[s.dayMoveBtn, props.isFirst && { opacity: 0.3 }]}
            >
              <Text style={s.dayMoveBtnText}>{ICON_UP}</Text>
            </Pressable>
            <Pressable
              disabled={props.isLast}
              onPress={() => props.onMoveDay(1)}
              style={[s.dayMoveBtn, props.isLast && { opacity: 0.3 }]}
            >
              <Text style={s.dayMoveBtnText}>{ICON_DOWN}</Text>
            </Pressable>
            {props.daysCount > 1 && (
              <Pressable onPress={props.onRemove} style={s.dayTrashBtn}>
                <Text style={s.dayTrashBtnText}>{ICON_TRASH}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}
