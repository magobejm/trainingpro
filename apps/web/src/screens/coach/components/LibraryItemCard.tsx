import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CardImage } from './LibraryItemCard/CardImage';
import { CardFooter } from './LibraryItemCard/CardFooter';
import { CardDetails } from './LibraryItemCard/CardDetails';
import { readFrontEnv } from '../../../data/env';

type Props = {
  deleting?: boolean;
  description?: string | null;
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
};

function resolveApiBaseUrl(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/assets/placeholders/plan-bg.jpg`;

function getFullUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') return PLACEHOLDER_IMAGE;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function isPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes('placeholder') || lower.includes('plan-bg.jpg');
}

function CardInfo({
  name,
  description,
  t,
}: {
  name: string;
  description: string | null | undefined;
  t: (k: string) => string;
}) {
  return (
    <>
      <Text numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Text numberOfLines={2} style={styles.description}>
        {description || t('coach.library.exercises.detail.empty')}
      </Text>
    </>
  );
}

type CardBodyProps = {
  name: string;
  description: string | null | undefined;
  coachOwned: boolean;
  expanded: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onToggle: () => void;
  detailImageUrl: string | null;
  youtubeUrl?: string | null;
  t: (key: string) => string;
};

function CardBody(props: CardBodyProps) {
  return (
    <View style={styles.content}>
      <CardInfo description={props.description} name={props.name} t={props.t} />
      <CardFooter
        coachOwned={props.coachOwned}
        expanded={props.expanded}
        onDelete={props.onDelete}
        onEdit={props.onEdit}
        onToggle={props.onToggle}
        t={props.t}
      />
      <CardDetails
        description={props.description}
        expanded={props.expanded}
        imageUrl={props.detailImageUrl}
        t={props.t}
        youtubeUrl={props.youtubeUrl}
      />
    </View>
  );
}

export function LibraryItemCard(props: Props): React.JSX.Element {
  const coachOwned = props.scope === 'coach';
  const imageUrl = getFullUrl(props.imageUrl);
  const detailImageUrl = !isPlaceholderUrl(props.imageUrl) ? imageUrl : null;

  return (
    <View style={[styles.card, props.deleting && styles.deletingCard]}>
      <CardImage
        imageUrl={imageUrl}
        name={props.name}
        scope={props.scope}
        subtitle={props.subtitle}
        t={props.t}
      />
      <CardBody
        coachOwned={coachOwned}
        description={props.description}
        detailImageUrl={detailImageUrl}
        expanded={props.expanded}
        name={props.name}
        onDelete={props.onDelete}
        onEdit={props.onEdit}
        onToggle={props.onToggle}
        t={props.t}
        youtubeUrl={props.youtubeUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  deletingCard: { opacity: 0.5 },
  content: { padding: 16 },
  name: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  description: { color: '#64748b', fontSize: 13, lineHeight: 18, marginTop: 4 },
});
