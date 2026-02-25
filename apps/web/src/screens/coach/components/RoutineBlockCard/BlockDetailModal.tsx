import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { LibraryMediaViewer } from '../LibraryMediaViewer';
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
  getFullUrl,
  mapCardio,
  mapExercise,
  mapPlio,
  mapSport,
  mapWarmup,
  resolvePlaceholder,
} from './BlockDetailModal.utils';

const ANIM = 'fade' as const;

type Props = { block: DraftBlock; visible: boolean; onClose: () => void };

function useLibrarySources(type: string, query: string) {
  const s = useLibraryExercisesQuery({ query: type === 'strength' ? query : undefined });
  const c = useLibraryCardioMethodsQuery({ query: type === 'cardio' ? query : undefined });
  const p = useLibraryPlioExercisesQuery({ query: type === 'plio' ? query : undefined });
  const w = useLibraryWarmupExercisesQuery({ query: type === 'warmup' ? query : undefined });
  const sp = useLibrarySportsQuery();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapper = (m: (i: any) => DetailItem) => m as (i: LibraryItemUnion) => DetailItem;
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
  const target =
    source.items.find((i) => i.id === block.libraryId || i.name === block.displayName) || null;
  return { item: target ? source.map(target) : null, isLoading: source.isLoading };
}

const DetailSections = ({ item, t }: { item: DetailItem; t: (k: string) => string }) => (
  <>
    <View style={styles.section}>
      <Text style={styles.label}>{t('coach.routine.picker.details.description')}</Text>
      <Text style={styles.value}>
        {item.description ?? t('coach.routine.picker.details.descriptionEmpty')}
      </Text>
    </View>
    {item.notes && (
      <View style={styles.section}>
        <Text style={styles.label}>{t('coach.routine.picker.details.notes')}</Text>
        <Text style={styles.value}>{item.notes}</Text>
      </View>
    )}
  </>
);

interface MediaProps {
  block: DraftBlock;
  item: DetailItem;
  t: (k: string) => string;
}

const DetailMedia = ({ block, item, t }: MediaProps) => {
  const imageUrl = useMemo(
    () => getFullUrl(block.type, item.imageUrl),
    [block.type, item.imageUrl],
  );
  const hasRealImage = Boolean(item.imageUrl && imageUrl !== resolvePlaceholder(block.type));
  return (
    <LibraryMediaViewer
      imageUrl={hasRealImage ? imageUrl : null}
      t={t}
      youtubeUrl={item.youtubeUrl ?? null}
    />
  );
};

const DetailContent = ({ block, item, t }: MediaProps) => (
  <ScrollView contentContainerStyle={styles.body}>
    <Text style={styles.name}>{item.name}</Text>
    <DetailSections item={item} t={t} />
    <DetailMedia block={block} item={item} t={t} />
  </ScrollView>
);

export function BlockDetailModal({ block, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { item, isLoading } = useBlockDetail(block);
  return (
    <Modal animationType={ANIM} onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('coach.routine.picker.details.title')}</Text>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : item ? (
            <DetailContent block={block} item={item} t={t} />
          ) : (
            <Text style={styles.empty}>{t('coach.routine.picker.details.empty')}</Text>
          )}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: '#64748b',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 12,
  },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { color: '#64748b', marginTop: 12, textAlign: 'center' },
  label: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  loader: { marginTop: 12 },
  name: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  section: { gap: 6 },
  sheet: { backgroundColor: '#fff', borderRadius: 16, maxWidth: 720, padding: 20, width: '100%' },
  title: { color: '#0f172a', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  value: { color: '#1e293b', fontSize: 13, lineHeight: 18 },
});
