import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

const PLACEHOLDER_COLOR = '#94a3b8';
const ICON_WARMUP = '🔥';
const ICON_REMOVE = '✕';
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
  warmupTemplates?: Array<{ id: string; name: string }>;
  onPickWarmup?: () => void;
  onRemoveWarmup?: (templateId: string) => void;
  onViewWarmup?: (templateId: string) => void;
}

export function DayHeader(props: DayHeaderProps): React.JSX.Element {
  const addKey = props.addExerciseLabelKey ?? 'coach.routine.addExercise';
  const placeholderKey = props.sessionPlaceholderKey ?? 'coach.routine.sessionNamePlaceholder';
  const dayLabel = `Día ${props.dayNumber}`;
  const badge = String(props.dayNumber).padStart(2, '0');
  return (
    <View>
      <View style={s.dayCardHeaderRow}>
        <Pressable onPress={props.onToggleCollapse} style={s.dayCollapseBtn}>
          <Text style={s.dayCollapseBtnText}>{props.isCollapsed ? ICON_CLOSED : ICON_OPEN}</Text>
        </Pressable>
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Pressable
          onPress={props.onToggleCollapse}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' } as never}
        >
          <View style={s.dayNumberBadge}>
            <Text style={s.dayNumberBadgeText}>{badge}</Text>
          </View>
          <View style={s.dayTitleBlock}>
            <Text style={s.dayTitleMain}>{dayLabel}</Text>
            <Text style={s.dayTitleSub}>{props.t('coach.routine.exercisesAdded', { count: props.blockCount })}</Text>
          </View>
        </Pressable>
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
      <WarmupTagsRow
        templates={props.warmupTemplates ?? []}
        readOnly={props.readOnly}
        onPick={props.onPickWarmup}
        onRemove={props.onRemoveWarmup}
        onView={props.onViewWarmup}
        t={props.t}
      />
    </View>
  );
}

function WarmupTagsRow(props: {
  templates: Array<{ id: string; name: string }>;
  readOnly: boolean;
  onPick?: () => void;
  onRemove?: (templateId: string) => void;
  onView?: (templateId: string) => void;
  t: (k: string) => string;
}) {
  const hasTemplates = props.templates.length > 0;
  if (!hasTemplates && props.readOnly) return null;
  return (
    <View style={wts.row}>
      {props.templates.map((tpl) => (
        <View key={tpl.id} style={wts.tag}>
          <Pressable onPress={() => props.onView?.(tpl.id)} style={wts.tagLabel}>
            <Text style={wts.tagIcon}>{ICON_WARMUP}</Text>
            <Text style={wts.tagText} numberOfLines={1}>
              {tpl.name}
            </Text>
          </Pressable>
          {!props.readOnly && (
            <Pressable onPress={() => props.onRemove?.(tpl.id)} style={wts.tagRemove}>
              <Text style={wts.tagRemoveText}>{ICON_REMOVE}</Text>
            </Pressable>
          )}
        </View>
      ))}
      {!props.readOnly && (
        <Pressable onPress={props.onPick} style={wts.addBtn}>
          <Text style={wts.addBtnText}>
            {ICON_WARMUP} {props.t('coach.routine.warmup.assign')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const wts = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 6,
  },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingLeft: 8,
    maxWidth: 280,
  },
  tagLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 4,
    paddingRight: 4,
  },
  tagIcon: { fontSize: 12 },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400e',
    maxWidth: 200,
  },
  tagRemove: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#fbbf24',
  },
  tagRemoveText: { fontSize: 10, color: '#92400e' },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed' as const,
    backgroundColor: '#fefce8',
  },
  addBtnText: { fontSize: 11, color: '#92400e' },
};
