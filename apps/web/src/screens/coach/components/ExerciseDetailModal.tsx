import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, DimensionValue } from 'react-native';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { readFrontEnv } from '../../../data/env';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

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
      // eslint-disable-next-line no-restricted-syntax
      animationType="fade"
      onRequestClose={props.onClose}
      transparent={true}
      visible={!!props.item}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.mediaArea}>
            <LibraryMediaViewer
              fullWidth={true}
              imageUrl={detailImageUrl}
              t={props.t}
              youtubeUrl={props.item.youtubeUrl ?? null}
            />
          </View>
          <InfoArea item={props.item} onClose={props.onClose} t={props.t} />
        </View>
      </View>
    </Modal>
  );
}

// eslint-disable-next-line max-lines-per-function
function InfoArea({ item, t, onClose }: { item: ExerciseLibraryItem; t: Props['t']; onClose: () => void }) {
  // eslint-disable-next-line no-restricted-syntax
  const closeLabel = 'Cerrar ✕';
  // eslint-disable-next-line no-restricted-syntax
  const equipmentPrefix = 'Equipamiento: ';
  // eslint-disable-next-line no-restricted-syntax
  const musclePrefix = t('coach.library.exercises.detail.muscleGroup') + ': ';

  return (
    <ScrollView contentContainerStyle={styles.infoContent} style={styles.infoArea}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>
            {musclePrefix}
            {item.muscleGroup}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.tagsRow}>
        <View style={[styles.tag, styles.muscleTag]}>
          <Text style={[styles.tagText, styles.muscleTagText]}>{item.muscleGroup}</Text>
        </View>
        {item.equipment && (
          <View style={[styles.tag, styles.equipmentTag]}>
            <Text style={[styles.tagText, styles.equipmentTagText]}>
              {equipmentPrefix}
              {item.equipment}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{t('coach.library.exercises.detail.instructions')}</Text>
        <Text style={styles.instructionsText}>{item.instructions || t('coach.library.exercises.detail.empty')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  modalContainer: {
    width: '100%' as DimensionValue,
    maxWidth: 800,
    maxHeight: '90%' as DimensionValue,
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mediaArea: {
    width: '100%' as DimensionValue,
    height: 400,
    backgroundColor: colors.surfaceInverse,
  },
  infoArea: {
    flexShrink: 1,
  },
  infoContent: {
    padding: space.xxl,
    gap: space.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.lg,
  },
  titleGroup: {
    flex: 1,
    gap: space.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  closeBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 20,
  },
  closeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  muscleTag: {
    backgroundColor: colors.primaryBorder,
  },
  muscleTagText: {
    color: colors.primary,
  },
  equipmentTag: {
    backgroundColor: '#f3e8ff',
  },
  equipmentTagText: {
    color: '#9333ea',
  },
  instructionsContainer: {
    gap: space.sm,
    marginTop: space.sm,
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
