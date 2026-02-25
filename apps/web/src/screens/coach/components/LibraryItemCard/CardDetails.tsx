import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LibraryMediaViewer } from '../LibraryMediaViewer';

interface CardDetailsProps {
  expanded: boolean;
  description?: string | null;
  imageUrl: string | null;
  youtubeUrl?: string | null;
  t: (k: string) => string;
}

export function CardDetails({ expanded, description, imageUrl, youtubeUrl, t }: CardDetailsProps) {
  if (!expanded) return null;
  return (
    <View style={styles.detailBox}>
      {description && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('coach.library.exercises.detail.instructions')}</Text>
          <Text style={styles.detailValue}>{description}</Text>
        </View>
      )}
      <LibraryMediaViewer imageUrl={imageUrl} t={t} youtubeUrl={youtubeUrl ?? null} />
    </View>
  );
}

const styles = StyleSheet.create({
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
