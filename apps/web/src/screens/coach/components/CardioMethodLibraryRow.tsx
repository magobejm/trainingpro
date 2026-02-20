import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CardioMethodLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { LibraryMediaViewer } from './LibraryMediaViewer';

type Props = {
  deleting?: boolean;
  expanded: boolean;
  item: CardioMethodLibraryItem;
  onDelete?: () => void;
  onEdit?: () => void;
  onToggle: () => void;
  t: (key: string) => string;
};

export function CardioMethodLibraryRow(props: Props): React.JSX.Element {
  const scopeKey = readScopeKey(props.item.scope);
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{props.item.name}</Text>
          <Text style={styles.meta}>
            {props.t(`coach.library.scope.${scopeKey}`)}
            {props.t('coach.library.separator')}
            {props.item.methodType}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={props.onToggle} style={styles.button}>
            <Text style={styles.buttonLabel}>
              {props.expanded
                ? props.t('coach.library.cardio.actions.hideDetail')
                : props.t('coach.library.cardio.actions.viewDetail')}
            </Text>
          </Pressable>
          <CardioActions {...props} />
        </View>
      </View>
      {props.expanded ? <CardioDetail item={props.item} t={props.t} /> : null}
    </View>
  );
}

function readScopeKey(scope: string): 'coach' | 'global' {
  return scope.trim().toLowerCase() === 'coach' ? 'coach' : 'global';
}

function CardioDetail(props: {
  item: CardioMethodLibraryItem;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.detail}>
      <DetailLine
        label={props.t('coach.library.cardio.detail.methodType')}
        value={props.item.methodType}
      />
      <DetailLine
        label={props.t('coach.library.cardio.detail.description')}
        value={props.item.description ?? props.t('coach.library.cardio.detail.empty')}
      />
      <DetailLine
        label={props.t('coach.library.cardio.detail.media')}
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

function CardioActions(props: Props): React.JSX.Element {
  const coachOwned = readScopeKey(props.item.scope) === 'coach';
  if (!coachOwned) {
    return <></>;
  }
  return (
    <>
      <Pressable onPress={props.onEdit} style={styles.editButton}>
        <Text style={styles.editLabel}>{props.t('coach.library.exercises.actions.edit')}</Text>
      </Pressable>
      <Pressable onPress={props.onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteLabel}>
          {props.deleting
            ? props.t('coach.library.exercises.actions.deleting')
            : props.t('coach.library.exercises.actions.delete')}
        </Text>
      </Pressable>
    </>
  );
}

function DetailLine(props: { label: string; value?: string }): React.JSX.Element {
  return (
    <View>
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
  button: {
    alignItems: 'center',
    backgroundColor: '#e8f0fb',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  buttonLabel: {
    color: '#334e70',
    fontSize: 11,
    fontWeight: '700',
  },
  detail: {
    backgroundColor: '#f6f9ff',
    borderColor: '#dce6f3',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 10,
    padding: 10,
  },
  detailLabel: {
    color: '#334e70',
    fontSize: 11,
    fontWeight: '700',
  },
  detailValue: {
    color: '#1a2536',
    fontSize: 12,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#d92d20',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  deleteLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#627285',
    fontSize: 12,
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
    gap: 4,
  },
});
