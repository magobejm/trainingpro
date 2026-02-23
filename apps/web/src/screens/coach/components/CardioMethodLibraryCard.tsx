import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, DimensionValue } from 'react-native';
import { LibraryMediaViewer } from './LibraryMediaViewer';
import { readFrontEnv } from '../../../data/env';
import type { CardioMethodLibraryItem } from '../../../data/hooks/useLibraryQuery';

type Props = {
  deleting: boolean;
  expanded: boolean;
  item: CardioMethodLibraryItem;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  t: (key: string) => string;
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/assets/placeholders/cardio-bg.jpg`;
const ICON_EDIT = '✎';
const ICON_DELETE = '✕';

function getFullUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return PLACEHOLDER_IMAGE;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function CardioMethodLibraryCard(props: Props): React.JSX.Element {
  const coachOwned = props.item.scope.trim().toLowerCase() === 'coach';
  const detailImageUrl = props.item.media?.url ? getFullUrl(props.item.media.url) : null;

  return (
    <View style={styles.card}>
      <CardHeader coachOwned={coachOwned} item={props.item} t={props.t} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {props.item.name}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {props.item.description || props.t('coach.library.cardio.detail.empty')}
        </Text>
        <CardFooter
          coachOwned={coachOwned}
          expanded={props.expanded}
          onDelete={props.onDelete}
          onEdit={props.onEdit}
          onToggle={props.onToggle}
          t={props.t}
        />
        {props.expanded && (
          <CardDetailBox detailImageUrl={detailImageUrl} item={props.item} t={props.t} />
        )}
      </View>
    </View>
  );
}

type DetailBoxProps = {
  detailImageUrl: string | null;
  item: CardioMethodLibraryItem;
  t: (key: string) => string;
};
function CardDetailBox(props: DetailBoxProps) {
  return (
    <View style={styles.detailBox}>
      <DetailLine
        label={props.t('coach.library.cardio.detail.methodType')}
        value={props.item.methodType}
      />
      <DetailLine
        label={props.t('coach.library.cardio.detail.description')}
        value={props.item.description ?? props.t('coach.library.cardio.detail.empty')}
      />
      <LibraryMediaViewer
        imageUrl={props.detailImageUrl}
        t={props.t}
        youtubeUrl={props.item.youtubeUrl ?? null}
      />
    </View>
  );
}

type HeaderProps = {
  coachOwned: boolean;
  item: CardioMethodLibraryItem;
  t: (key: string) => string;
};
function CardHeader(props: HeaderProps): React.JSX.Element {
  const imageUrl = getFullUrl(props.item.media?.url);
  const scopeLabel = props.coachOwned
    ? props.t('coach.library.exercises.badge.mine')
    : props.t('coach.library.scope.global');

  return (
    <View style={styles.imageContainer}>
      <Image accessibilityLabel={props.item.name} source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.badgesOverlay}>
        <View style={styles.categoryBadge}>
          <Text style={styles.badgeText}>{props.item.methodType.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.scopeBadgeContainer}>
        <View style={[styles.scopeBadge, props.coachOwned ? styles.mineBadge : styles.globalBadge]}>
          <Text style={styles.scopeBadgeText}>{scopeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

type FooterProps = {
  coachOwned: boolean;
  expanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  t: (key: string) => string;
};
function CardFooter(props: FooterProps): React.JSX.Element {
  const toggleLabel = props.expanded
    ? props.t('coach.library.cardio.actions.hideDetail')
    : props.t('coach.library.cardio.actions.viewDetail');
  return (
    <View style={styles.footer}>
      <Pressable onPress={props.onToggle} style={styles.detailsButton}>
        <Text style={styles.detailsButtonText}>{toggleLabel}</Text>
      </Pressable>
      {props.coachOwned && (
        <View style={styles.adminActions}>
          <Pressable onPress={props.onEdit} style={styles.iconButton}>
            <Text style={styles.iconText}>{ICON_EDIT}</Text>
          </Pressable>
          <Pressable onPress={props.onDelete} style={[styles.iconButton, styles.deleteButton]}>
            <Text style={styles.iconText}>{ICON_DELETE}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {value ? <Text style={styles.detailValue}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  badgesOverlay: {
    flexDirection: 'row',
    gap: 4,
    left: 10,
    position: 'absolute',
    top: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    width: '100%',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  detailsButton: {
    paddingVertical: 4,
  },
  detailsButtonText: {
    color: '#1c74e9',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  globalBadge: {
    backgroundColor: '#f1f5f9',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconText: {
    fontSize: 14,
  },
  image: {
    aspectRatio: 16 / 9,
    width: '100%' as DimensionValue,
    minHeight: 180,
    backgroundColor: '#f1f5f9',
  },
  imageContainer: {
    position: 'relative',
  },
  mineBadge: {
    backgroundColor: '#dbeafe',
  },
  name: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  scopeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scopeBadgeContainer: {
    bottom: 10,
    position: 'absolute',
    right: 10,
  },
  scopeBadgeText: {
    color: '#1e293b',
    fontSize: 10,
    fontWeight: '600',
  },
  detailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
    padding: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#1e293b',
    fontSize: 13,
  },
});
