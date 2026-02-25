/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import type { BlockType } from '../../RoutinePlanner.types';
import {
  useLibraryExercisesQuery,
  useLibraryCardioMethodsQuery,
  useLibraryPlioExercisesQuery,
  useLibraryWarmupExercisesQuery,
  useLibrarySportsQuery,
} from '../../../../data/hooks/useLibraryQuery';

const MODAL_ANIMATION = 'slide' as const;

interface LibraryItem {
  id: string;
  name: string;
}

interface Props {
  blockType: BlockType | null;
  onCancel: () => void;
  onSelect: (libraryId: string, displayName: string) => void;
  t: (k: string) => string;
}

function useLibraryItems(
  blockType: BlockType | null,
  query: string,
): { items: LibraryItem[]; isLoading: boolean } {
  const str = useLibraryExercisesQuery({ query: blockType === 'strength' ? query : undefined });
  const car = useLibraryCardioMethodsQuery({ query: blockType === 'cardio' ? query : undefined });
  const plio = useLibraryPlioExercisesQuery({ query: blockType === 'plio' ? query : undefined });
  const warm = useLibraryWarmupExercisesQuery({
    query: blockType === 'warmup' ? query : undefined,
  });
  const sport = useLibrarySportsQuery();

  if (blockType === 'strength') return { items: str.data ?? [], isLoading: str.isLoading };
  if (blockType === 'cardio') return { items: car.data ?? [], isLoading: car.isLoading };
  if (blockType === 'plio') return { items: plio.data ?? [], isLoading: plio.isLoading };
  if (blockType === 'warmup') return { items: warm.data ?? [], isLoading: warm.isLoading };
  if (blockType === 'sport') {
    const q = query.toLowerCase();
    const filtered = query
      ? (sport.data ?? []).filter((s) => s.name.toLowerCase().includes(q))
      : (sport.data ?? []);
    return { items: filtered, isLoading: sport.isLoading };
  }
  return { items: [], isLoading: false };
}

function ExerciseRow({ item, onPress }: { item: LibraryItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <Text style={s.rowText}>{item.name}</Text>
      <Text style={s.rowChevron}>{'\u203a'}</Text>
    </Pressable>
  );
}

function PickerHeader({ label, t }: { label: string; t: (k: string) => string }) {
  const sep = ' \u2014 ';
  return (
    <Text style={s.title}>
      {t('coach.routine.picker.title')}
      {sep}
      {label}
    </Text>
  );
}

function PickerBody({
  items,
  isLoading,
  onSelect,
  t,
}: {
  items: LibraryItem[];
  isLoading: boolean;
  onSelect: (id: string, name: string) => void;
  t: (k: string) => string;
}) {
  if (isLoading) return <ActivityIndicator style={s.loader} />;
  if (items.length === 0) return <Text style={s.empty}>{t('coach.routine.picker.empty')}</Text>;
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ExerciseRow item={item} onPress={() => onSelect(item.id, item.name)} />
      )}
      style={s.list}
    />
  );
}

export function ExercisePickerModal({ blockType, onCancel, onSelect, t }: Props) {
  const [query, setQuery] = useState('');
  const { items, isLoading } = useLibraryItems(blockType, query);
  const blockTypeLabel = blockType ? t(`coach.routine.blockType.${blockType}`) : '';

  return (
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={onCancel}
      transparent
      visible={blockType !== null}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <PickerHeader label={blockTypeLabel} t={t} />
          <TextInput
            onChangeText={setQuery}
            placeholder={t('coach.routine.picker.search')}
            style={s.search}
            value={query}
          />
          <PickerBody isLoading={isLoading} items={items} onSelect={onSelect} t={t} />
          <Pressable onPress={onCancel} style={s.cancelBtn}>
            <Text style={s.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: '#64748b',
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { color: '#64748b', marginTop: 24, textAlign: 'center' },
  list: { flex: 1 },
  loader: { marginTop: 24 },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 14,
  },
  rowChevron: { color: '#94a3b8', fontSize: 18 },
  rowText: { color: '#0f172a', fontSize: 15 },
  search: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
});
