import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, DimensionValue } from 'react-native';
import { readFrontEnv } from '../../../data/env';
import type { CardioMethodLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { resolvePlaceholder } from './LibraryMediaViewer';

type Props = {
  deleting: boolean;
  item: CardioMethodLibraryItem;
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
  t: (key: string) => string;
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();

function getFullUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return resolvePlaceholder('cardio');
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

const ICON_EDIT = '✏️';
const ICON_DELETE = '🗑️';
const IMAGE_BLUR_RADIUS = 16;

// eslint-disable-next-line max-lines-per-function
export function CardioMethodLibraryCard(props: Props): React.JSX.Element {
  const coachOwned = props.item.scope.trim().toLowerCase() === 'coach';
  const imageUrl = getFullUrl(props.item.media?.url);

  return (
    <Pressable onPress={props.onPress} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          blurRadius={IMAGE_BLUR_RADIUS}
          // eslint-disable-next-line no-restricted-syntax
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={styles.imageBackdrop}
        />
        <View style={styles.imageShade} />
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Image resizeMode="contain" source={{ uri: imageUrl }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {props.item.name}
        </Text>

        <View style={styles.tagsRow}>
          <View style={styles.tagPrimary}>
            <Text style={styles.tagPrimaryText}>{props.item.methodType}</Text>
          </View>
          {props.item.equipment && (
            <View style={styles.tagSecondary}>
              <Text style={styles.tagSecondaryText}>{props.item.equipment}</Text>
            </View>
          )}
        </View>

        {coachOwned && (
          <View style={styles.actionsRow}>
            <Pressable onPress={props.onEdit} style={styles.actionBtn}>
              {/* eslint-disable-next-line no-restricted-syntax */}
              <Text style={styles.actionIcon}>{ICON_EDIT}</Text>
            </Pressable>
            <Pressable onPress={props.onDelete} style={[styles.actionBtn, styles.actionDelete]}>
              {/* eslint-disable-next-line no-restricted-syntax */}
              <Text style={styles.actionIcon}>{ICON_DELETE}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    width: '100%' as DimensionValue,
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%' as DimensionValue,
    height: 200,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 20, 0.2)',
  },
  image: {
    width: '100%' as DimensionValue,
    height: '100%' as DimensionValue,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagPrimary: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPrimaryText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  tagSecondary: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagSecondaryText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
  },
  actionDelete: {
    backgroundColor: '#fee2e2',
  },
  actionIcon: {
    fontSize: 14,
  },
});
