import React from 'react';
import { StyleSheet, Text, View, Pressable, DimensionValue } from 'react-native';
import { CardImage } from './LibraryItemCard/CardImage';
import { CardFooter } from './LibraryItemCard/CardFooter';
import { readFrontEnv } from '../../../data/env';
import { resolvePlaceholder } from './LibraryMediaViewer';

type Props = {
  deleting?: boolean;
  description?: string | null;
  descriptionLabelKey?: string;
  detailRows?: ReadonlyArray<{ labelKey: string; value: null | string | undefined }>;
  expanded: boolean;
  imageUrl?: string | null;
  name: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onToggle: () => void;
  scope?: 'coach' | 'global';
  subtitle?: string | null;
  t: (key: string) => string;
  youtubeUrl?: string | null;
  category?: 'strength' | 'cardio' | 'plio' | 'warmup' | 'sport';
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();

function getFullUrl(url: string | null | undefined, category?: string): string {
  if (!url || url.trim() === '') {
    return resolvePlaceholder(category);
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function LibraryItemCard(props: Props): React.JSX.Element {
  const coachOwned = props.scope === 'coach';
  const imageUrl = getFullUrl(props.imageUrl, props.category);

  return (
    <Pressable
      onPress={props.onToggle}
      style={[styles.card, props.deleting && styles.deletingCard]}
    >
      <CardImage
        imageUrl={imageUrl}
        name={props.name}
        scope={props.scope}
        subtitle={props.subtitle}
        t={props.t}
      />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {props.name}
        </Text>
        <View style={styles.tagsRow}>
          <View style={styles.tagPrimary}>
            <Text style={styles.tagPrimaryText}>{props.subtitle}</Text>
          </View>
        </View>
        <CardFooter coachOwned={coachOwned} onDelete={props.onDelete} onEdit={props.onEdit} />
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
  deletingCard: { opacity: 0.5 },
  content: {
    padding: 20,
    gap: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPrimary: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPrimaryText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
});
