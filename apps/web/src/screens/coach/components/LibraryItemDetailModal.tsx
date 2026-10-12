import React from 'react';
import { StyleSheet, Text, View, DimensionValue } from 'react-native';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { readFrontEnv } from '../../../data/env';
import { Badge, Modal, colors, fontSize, space } from '@trainerpro/ui';

type LibraryItem = {
  id: string;
  name: string;
  media?: { url: string | null };
  youtubeUrl?: string | null;
  instructions?: string | null;
  description?: string | null;
  muscleGroup?: string;
  methodType?: string;
  equipment?: string | null;
};

type Props = {
  item: LibraryItem | null;
  onClose: () => void;
  t: (key: string) => string;
  type: 'strength' | 'cardio' | 'isometric' | 'plio' | 'mobility';
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
const API_BASE_URL = resolveApiBaseUrl();

function getFullUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function LibraryItemDetailModal(props: Props): React.JSX.Element | null {
  if (!props.item) return null;

  const item = props.item;
  const detailImageUrl = getFullUrl(item.media?.url);

  return (
    <Modal closeLabel={props.t('common.close')} onClose={props.onClose} size="lg" title={item.name} visible={!!props.item}>
      <View style={styles.mediaArea}>
        <LibraryMediaViewer
          category={props.type}
          fullWidth={true}
          imageUrl={detailImageUrl}
          t={props.t}
          youtubeUrl={item.youtubeUrl ?? null}
        />
      </View>
      <InfoArea {...props} item={item} />
    </Modal>
  );
}

function InfoArea({ item, t, type }: { item: LibraryItem; t: Props['t']; type: Props['type'] }) {
  const categoryLabel = type === 'strength' ? item.muscleGroup : item.methodType;
  const mainInfoLabel =
    type === 'strength' ? t('coach.library.exercises.detail.muscleGroup') : t('coach.library.cardio.detail.methodType');

  const contentText = item.instructions || item.description || t('coach.library.exercises.detail.empty');
  const contentTitle =
    type === 'strength' ? t('coach.library.exercises.detail.instructions') : t('coach.library.cardio.detail.description');

  return (
    <View style={styles.infoContent}>
      <Text style={styles.subtitle}>{`${mainInfoLabel}: ${categoryLabel ?? ''}`}</Text>

      <View style={styles.tagsRow}>
        {categoryLabel ? <Badge label={categoryLabel} tone="primary" /> : null}
        {item.equipment ? (
          <Badge label={`${t('coach.library.fields.equipmentLabel')}: ${item.equipment}`} tone="neutral" />
        ) : null}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{contentTitle}</Text>
        <Text style={styles.instructionsText}>{contentText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mediaArea: {
    width: '100%' as DimensionValue,
    height: 400,
    backgroundColor: colors.surfaceInverse,
  },
  infoContent: {
    paddingVertical: space.lg,
    gap: space.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  instructionsContainer: {
    gap: space.sm,
  },
  instructionsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
