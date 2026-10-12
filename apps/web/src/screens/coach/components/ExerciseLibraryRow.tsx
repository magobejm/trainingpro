import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  deleting: boolean;
  expanded: boolean;
  item: ExerciseLibraryItem;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  t: (key: string) => string;
};

export function ExerciseLibraryRow(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      <ExerciseRowHeader {...props} />
      {props.expanded ? <ExerciseDetail item={props.item} t={props.t} /> : null}
    </View>
  );
}

function ExerciseRowHeader(props: Props): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TitleBlock item={props.item} t={props.t} />
      <ActionBlock {...props} />
    </View>
  );
}

function TitleBlock(props: Pick<Props, 'item' | 't'>): React.JSX.Element {
  const coachOwned = isCoachScope(props.item.scope);
  return (
    <View style={styles.titleBox}>
      <Text style={styles.title}>{props.item.name}</Text>
      <View style={[styles.badge, coachOwned ? styles.mineBadge : null]}>
        <Text style={styles.badgeLabel}>
          {coachOwned ? props.t('coach.library.exercises.badge.mine') : props.t('coach.library.scope.global')}
        </Text>
      </View>
    </View>
  );
}

function ActionBlock(props: Props): React.JSX.Element {
  const coachOwned = isCoachScope(props.item.scope);
  return (
    <View style={styles.actions}>
      <Pressable onPress={props.onToggle} style={styles.detailButton}>
        <Text style={styles.detailLabel}>{readDetailActionLabel(props)}</Text>
      </Pressable>
      {coachOwned ? <EditButton {...props} /> : null}
      {coachOwned ? <DeleteButton {...props} /> : null}
    </View>
  );
}

function EditButton(props: Props): React.JSX.Element {
  return (
    <Pressable onPress={props.onEdit} style={styles.editButton}>
      <Text style={styles.editLabel}>{props.t('coach.library.exercises.actions.edit')}</Text>
    </Pressable>
  );
}

function DeleteButton(props: Props): React.JSX.Element {
  return (
    <Pressable onPress={props.onDelete} style={styles.deleteButton}>
      <Text style={styles.deleteLabel}>
        {props.deleting
          ? props.t('coach.library.exercises.actions.deleting')
          : props.t('coach.library.exercises.actions.delete')}
      </Text>
    </Pressable>
  );
}

function readDetailActionLabel(props: Props): string {
  return props.expanded
    ? props.t('coach.library.exercises.actions.hideDetail')
    : props.t('coach.library.exercises.actions.viewDetail');
}

function isCoachScope(scope: string): boolean {
  return scope.trim().toLowerCase() === 'coach';
}

function ExerciseDetail(props: { item: ExerciseLibraryItem; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.detailBox}>
      <DetailLine label={props.t('coach.library.exercises.detail.muscleGroup')} value={props.item.muscleGroup} />
      <DetailLine
        label={props.t('coach.library.exercises.detail.equipment')}
        value={props.item.equipment ?? props.t('coach.library.exercises.detail.empty')}
      />
      <DetailLine
        label={props.t('coach.library.exercises.detail.instructions')}
        value={props.item.instructions ?? props.t('coach.library.exercises.detail.empty')}
      />
      <DetailLine label={props.t('coach.library.exercises.detail.media')} value={undefined} />
      <LibraryMediaViewer imageUrl={props.item.media.url} t={props.t} youtubeUrl={props.item.youtubeUrl} />
    </View>
  );
}

function DetailLine(props: { label: string; value?: string }): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{props.label}</Text>
      {props.value ? <Text style={styles.detailValue}>{props.value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  badge: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  badgeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: space.md,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: space.md,
  },
  editLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  deleteLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  detailBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: space.md,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  detailRow: {
    gap: 2,
  },
  detailValue: {
    color: colors.text,
    fontSize: fontSize.xs,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mineBadge: {
    backgroundColor: colors.primaryBorder,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: space.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  titleBox: {
    gap: space.xs,
  },
});
