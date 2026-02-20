import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { LibraryMediaViewer } from './LibraryMediaViewer';

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
          {coachOwned
            ? props.t('coach.library.exercises.badge.mine')
            : props.t('coach.library.scope.global')}
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

function ExerciseDetail(props: {
  item: ExerciseLibraryItem;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.detailBox}>
      <DetailLine
        label={props.t('coach.library.exercises.detail.muscleGroup')}
        value={props.item.muscleGroup}
      />
      <DetailLine
        label={props.t('coach.library.exercises.detail.equipment')}
        value={props.item.equipment ?? props.t('coach.library.exercises.detail.empty')}
      />
      <DetailLine
        label={props.t('coach.library.exercises.detail.instructions')}
        value={props.item.instructions ?? props.t('coach.library.exercises.detail.empty')}
      />
      <DetailLine
        label={props.t('coach.library.exercises.detail.media')}
        value={undefined}
      />
      <LibraryMediaViewer
        imageUrl={props.item.media.url}
        t={props.t}
        youtubeUrl={props.item.youtubeUrl}
      />
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
    gap: 8,
  },
  badge: {
    backgroundColor: '#edf2f7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: '#485a73',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#d92d20',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  editLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  detailBox: {
    backgroundColor: '#f6f9ff',
    borderColor: '#dce6f3',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 10,
    padding: 10,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#e8f0fb',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  detailLabel: {
    color: '#334e70',
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    gap: 2,
  },
  detailValue: {
    color: '#1a2536',
    fontSize: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mineBadge: {
    backgroundColor: '#dbeafe',
  },
  row: {
    borderBottomColor: '#e2e8f2',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  title: {
    color: '#0e1a2f',
    fontSize: 15,
    fontWeight: '700',
  },
  titleBox: {
    gap: 5,
  },
});
