import React from 'react';
import { StyleSheet, Text, View, Pressable, DimensionValue } from 'react-native';
import { CardImage } from './LibraryItemCard/CardImage';
import { CardFooter } from './LibraryItemCard/CardFooter';
import { readFrontEnv } from '../../../data/env';
import { resolvePlaceholder } from './LibraryMediaViewer';
import { Badge, colors, fontSize, space } from '@trainerpro/ui';

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
  category?: 'strength' | 'cardio' | 'isometric' | 'plio' | 'mobility' | 'sport';
  equipment?: null | string;
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
  const equipment = props.equipment;

  return (
    <Pressable {...{ dataSet: { 'interactive-card': 'true' } }} onPress={props.onToggle} style={[styles.card, props.deleting && styles.deletingCard]}>
      <CardImage imageUrl={imageUrl} name={props.name} scope={props.scope} t={props.t} />
      <View {...{ dataSet: { 'density-row': 'true' } }} style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {props.name}
        </Text>
        <Tags subtitle={props.subtitle} equipment={equipment} />
        <CardFooter coachOwned={coachOwned} onDelete={props.onDelete} onEdit={props.onEdit} t={props.t} />
      </View>
    </Pressable>
  );
}

function Tags(props: { equipment?: null | string; subtitle?: null | string }): React.JSX.Element {
  return (
    <View style={styles.tagsRow}>
      {props.subtitle ? <Badge label={props.subtitle} /> : null}
      {props.equipment ? <Badge label={props.equipment} tone="primary" /> : null}
    </View>
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
  deletingCard: { opacity: 0.5 },
  content: {
    padding: space.xl,
    gap: space.md,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
});
