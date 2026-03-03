import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DraftBlock } from '../../RoutinePlanner.types';
import {
  useLibraryExercisesQuery,
  useLibraryCardioMethodsQuery,
  useLibraryPlioExercisesQuery,
  useLibraryWarmupExercisesQuery,
  useLibrarySportsQuery,
} from '../../../../data/hooks/useLibraryQuery';
import {
  DetailItem,
  DetailSource,
  LibraryItemUnion,
  mapCardio,
  mapExercise,
  mapPlio,
  mapSport,
  mapWarmup,
} from './BlockDetailModal.utils';
import { LibraryItemDetailModal } from '../LibraryItemDetailModal';

type Props = { block: DraftBlock; visible: boolean; onClose: () => void };
const MODAL_ANIMATION = 'fade' as const;
const SPINNER_SIZE = 'large' as const;
const SPINNER_COLOR = '#ffffff';

function useLibrarySources(type: string, query: string) {
  const s = useLibraryExercisesQuery({ query: type === 'strength' ? query : undefined });
  const c = useLibraryCardioMethodsQuery({ query: type === 'cardio' ? query : undefined });
  const p = useLibraryPlioExercisesQuery({ query: type === 'plio' ? query : undefined });
  const w = useLibraryWarmupExercisesQuery({ query: type === 'warmup' ? query : undefined });
  const sp = useLibrarySportsQuery();
  const mapper = <T extends LibraryItemUnion>(m: (item: T) => DetailItem) =>
    m as (item: LibraryItemUnion) => DetailItem;
  return {
    strength: { items: s.data ?? [], isLoading: s.isLoading, map: mapper(mapExercise) },
    cardio: { items: c.data ?? [], isLoading: c.isLoading, map: mapper(mapCardio) },
    plio: { items: p.data ?? [], isLoading: p.isLoading, map: mapper(mapPlio) },
    warmup: { items: w.data ?? [], isLoading: w.isLoading, map: mapper(mapWarmup) },
    sport: { items: sp.data ?? [], isLoading: sp.isLoading, map: mapper(mapSport) },
  };
}

function useBlockDetail(block: DraftBlock): { item: DetailItem | null; isLoading: boolean } {
  const sources = useLibrarySources(block.type, block.displayName);
  const source = (sources as Record<string, DetailSource>)[block.type];
  if (!source) return { item: null, isLoading: false };
  const target =
    source.items.find((i) => i.id === block.libraryId || i.name === block.displayName) || null;
  return { item: target ? source.map(target) : null, isLoading: source.isLoading };
}

export function BlockDetailModal({ block, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { item, isLoading } = useBlockDetail(block);

  if (!visible) return null;

  if (isLoading) {
    return (
      <Modal animationType={MODAL_ANIMATION} transparent visible={visible}>
        <View style={styles.overlay}>
          <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
        </View>
      </Modal>
    );
  }

  if (!item) return null;

  return (
    <LibraryItemDetailModal
      item={{
        ...item,
        media: item.imageUrl ? { url: item.imageUrl } : undefined,
      }}
      onClose={onClose}
      t={t}
      type={toDetailModalType(block.type)}
    />
  );
}

function toDetailModalType(type: DraftBlock['type']): 'cardio' | 'plio' | 'strength' | 'warmup' {
  return type === 'sport' ? 'warmup' : type;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
  },
});
