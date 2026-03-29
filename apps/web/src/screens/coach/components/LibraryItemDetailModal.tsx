import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, DimensionValue } from 'react-native';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { readFrontEnv } from '../../../data/env';

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
              category={props.type}
              fullWidth={true}
              imageUrl={detailImageUrl}
              t={props.t}
              youtubeUrl={item.youtubeUrl ?? null}
            />
          </View>
          <InfoArea {...props} item={item} />
        </View>
      </View>
    </Modal>
  );
}

// eslint-disable-next-line max-lines-per-function
function InfoArea({
  item,
  t,
  onClose,
  type,
}: {
  item: LibraryItem;
  t: Props['t'];
  onClose: () => void;
  type: Props['type'];
}) {
  // eslint-disable-next-line no-restricted-syntax
  const closeLabel = 'Cerrar ✕';
  // eslint-disable-next-line no-restricted-syntax
  const separator = ': ';

  const categoryLabel = type === 'strength' ? item.muscleGroup : item.methodType;
  const mainInfoLabel =
    type === 'strength' ? t('coach.library.exercises.detail.muscleGroup') : t('coach.library.cardio.detail.methodType');

  const contentText = item.instructions || item.description || t('coach.library.exercises.detail.empty');
  const contentTitle =
    type === 'strength' ? t('coach.library.exercises.detail.instructions') : t('coach.library.cardio.detail.description');

  return (
    <ScrollView contentContainerStyle={styles.infoContent} style={styles.infoArea}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>
            {mainInfoLabel}
            {separator}
            {categoryLabel}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.tagsRow}>
        <View style={[styles.tag, styles.primaryTag]}>
          <Text style={[styles.tagText, styles.primaryTagText]}>{categoryLabel}</Text>
        </View>
        {item.equipment && (
          <View style={[styles.tag, styles.secondaryTag]}>
            {/* eslint-disable-next-line no-restricted-syntax */}
            <Text style={[styles.tagText, styles.secondaryTagText]}>Equipamiento: {item.equipment}</Text>
          </View>
        )}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>{contentTitle}</Text>
        <Text style={styles.instructionsText}>{contentText}</Text>
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
    padding: 24,
  },
  modalContainer: {
    width: '100%' as DimensionValue,
    maxWidth: 800,
    maxHeight: '90%' as DimensionValue,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mediaArea: {
    width: '100%' as DimensionValue,
    height: 400,
    backgroundColor: '#0f172a',
  },
  infoArea: {
    flexShrink: 1,
  },
  infoContent: {
    padding: 32,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryTag: {
    backgroundColor: '#dbeafe',
  },
  primaryTagText: {
    color: '#2563eb',
  },
  secondaryTag: {
    backgroundColor: '#f3e8ff',
  },
  secondaryTagText: {
    color: '#9333ea',
  },
  instructionsContainer: {
    gap: 8,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  instructionsText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
