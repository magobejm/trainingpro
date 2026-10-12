import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { Button, IconButton, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

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
  const vm = useDayHeaderModel(props);

  return (
    <View>
      <View style={s.dayCardHeaderRow}>
        <IconButton
          accessibilityLabel={props.t(
            props.isCollapsed ? 'coach.routine.day.a11y.expand' : 'coach.routine.day.a11y.collapse',
          )}
          icon={(color) => (
            <Text style={[s.dayCollapseBtnText, { color }]}>{props.isCollapsed ? ICON_CLOSED : ICON_OPEN}</Text>
          )}
          onPress={props.onToggleCollapse}
          size={28}
        />
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Pressable
          onPress={props.onToggleCollapse}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, cursor: 'pointer' } as never}
        >
          <View style={s.dayNumberBadge}>
            <Text style={s.dayNumberBadgeText}>{vm.badge}</Text>
          </View>
          <View style={s.dayTitleBlock}>
            <Text style={s.dayTitleMain}>{vm.dayLabel}</Text>
            <Text style={s.dayTitleSub}>{props.t('coach.routine.exercisesAdded', { count: props.blockCount })}</Text>
          </View>
        </Pressable>
        <TextField
          containerStyle={s.daySessionInput}
          disabled={props.readOnly}
          onChangeText={props.onRename}
          placeholder={props.t(vm.placeholderKey)}
          value={props.title}
        />
        <View style={s.dayHeaderRight}>
          {!props.readOnly && <Button label={props.t(vm.addKey)} onPress={props.onAddBlock} size="sm" />}
          {!props.readOnly && (
            <>
              <IconButton
                accessibilityLabel={props.t('coach.routine.day.a11y.moveUp')}
                disabled={props.isFirst}
                icon={(color) => <Text style={{ color, fontSize: fontSize.sm }}>{ICON_UP}</Text>}
                onPress={() => props.onMoveDay(-1)}
                size={28}
              />
              <IconButton
                accessibilityLabel={props.t('coach.routine.day.a11y.moveDown')}
                disabled={props.isLast}
                icon={(color) => <Text style={{ color, fontSize: fontSize.sm }}>{ICON_DOWN}</Text>}
                onPress={() => props.onMoveDay(1)}
                size={28}
              />
              {props.daysCount > 1 && (
                <IconButton
                  accessibilityLabel={props.t('coach.routine.day.a11y.remove')}
                  icon={(color) => <Text style={{ color, fontSize: fontSize.sm }}>{ICON_TRASH}</Text>}
                  onPress={props.onRemove}
                  size={28}
                  tone="danger"
                />
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

function useDayHeaderModel(props: DayHeaderProps) {
  return {
    addKey: props.addExerciseLabelKey ?? 'coach.routine.addExercise',
    badge: String(props.dayNumber).padStart(2, '0'),
    dayLabel: `Día ${props.dayNumber}`,
    placeholderKey: props.sessionPlaceholderKey ?? 'coach.routine.sessionNamePlaceholder',
  };
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
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingLeft: space.sm,
    maxWidth: 280,
  },
  tagLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.xs,
    paddingVertical: space.xs,
    paddingRight: space.xs,
  },
  tagIcon: { fontSize: fontSize.xs },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: '600' as const,
    color: colors.warning,
    maxWidth: 200,
  },
  tagRemove: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderLeftWidth: 1,
    borderLeftColor: colors.warning,
  },
  tagRemoveText: { fontSize: fontSize.xs, color: colors.warning },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    backgroundColor: colors.warningSoft,
  },
  addBtnText: { fontSize: fontSize.xs, color: colors.warning },
};
