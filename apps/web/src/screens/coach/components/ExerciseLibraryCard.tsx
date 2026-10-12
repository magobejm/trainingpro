import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, DimensionValue } from 'react-native';
import { readFrontEnv } from '../../../data/env';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { resolvePlaceholder } from './LibraryMediaViewer';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  deleting: boolean;
  item: ExerciseLibraryItem;
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
    return resolvePlaceholder('strength');
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

const ICON_EDIT = '✏️';
const ICON_DELETE = '🗑️';
const IMAGE_BLUR_RADIUS = 16;

// eslint-disable-next-line max-lines-per-function
export function ExerciseLibraryCard(props: Props): React.JSX.Element {
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
            <Text style={styles.tagPrimaryText}>{props.item.muscleGroup}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: '100%' as DimensionValue,
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%' as DimensionValue,
    height: 200,
    backgroundColor: colors.surfaceInverse,
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
    padding: space.xl,
    gap: space.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  tagPrimary: {
    backgroundColor: colors.primaryBorder,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  tagPrimaryText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  tagSecondary: {
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  tagSecondaryText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.md,
    marginTop: space.sm,
  },
  actionBtn: {
    backgroundColor: colors.background,
    padding: space.sm,
    borderRadius: radius.md,
  },
  actionDelete: {
    backgroundColor: colors.dangerSoft,
  },
  actionIcon: {
    fontSize: fontSize.sm,
  },
});
