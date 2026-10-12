import React from 'react';
import { StyleSheet, Text, View, DimensionValue } from 'react-native';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { readFrontEnv } from '../../../data/env';
import { Badge, Modal, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  item: ExerciseLibraryItem | null;
  onClose: () => void;
  t: (key: string) => string;
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

export function ExerciseDetailModal(props: Props): React.JSX.Element | null {
  if (!props.item) return null;

  const detailImageUrl = getFullUrl(props.item.media?.url);

  return (
    <Modal
      closeLabel={props.t('common.close')}
      onClose={props.onClose}
      size="lg"
      title={props.item.name}
      visible={!!props.item}
    >
      <View style={styles.mediaArea}>
        <LibraryMediaViewer
          fullWidth={true}
          imageUrl={detailImageUrl}
          t={props.t}
          youtubeUrl={props.item.youtubeUrl ?? null}
        />
      </View>
      <InfoArea item={props.item} t={props.t} />
    </Modal>
  );
}

function InfoArea({ item, t }: { item: ExerciseLibraryItem; t: Props['t'] }) {
  const equipmentPrefix = `${t('coach.library.fields.equipmentLabel')}: `;
  const musclePrefix = `${t('coach.library.exercises.detail.muscleGroup')}: `;

  return (
    <View style={styles.infoContent}>
      <Text style={styles.subtitle}>
        {musclePrefix}
        {item.muscleGroup}
      </Text>

      <View style={styles.tagsRow}>
        <Badge label={item.muscleGroup} tone="primary" />
        {item.equipment ? <Badge label={`${equipmentPrefix}${item.equipment}`} tone="neutral" /> : null}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{t('coach.library.exercises.detail.instructions')}</Text>
        <Text style={styles.instructionsText}>{item.instructions || t('coach.library.exercises.detail.empty')}</Text>
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
