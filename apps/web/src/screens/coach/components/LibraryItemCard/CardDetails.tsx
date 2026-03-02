import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LibraryMediaViewer } from '../LibraryMediaViewer';

interface CardDetailsProps {
  expanded: boolean;
  description?: string | null;
  descriptionLabelKey?: string;
  detailRows?: ReadonlyArray<{ labelKey: string; value: null | string | undefined }>;
  imageUrl: string | null;
  youtubeUrl?: string | null;
  t: (k: string) => string;
}

export function CardDetails({
  expanded,
  description,
  descriptionLabelKey,
  detailRows,
  imageUrl,
  youtubeUrl,
  t,
}: CardDetailsProps) {
  if (!expanded) return null;
  return (
    <View style={styles.detailBox}>
      <DetailRows detailRows={detailRows} t={t} />
      <DescriptionRow description={description} descriptionLabelKey={descriptionLabelKey} t={t} />
      <LibraryMediaViewer imageUrl={imageUrl} t={t} youtubeUrl={youtubeUrl ?? null} />
    </View>
  );
}

function DetailRows(props: {
  detailRows?: ReadonlyArray<{ labelKey: string; value: null | string | undefined }>;
  t: (k: string) => string;
}): React.JSX.Element | null {
  if (!props.detailRows?.length) return null;
  return (
    <>
      {props.detailRows.map((row) => (
        <View key={row.labelKey} style={styles.detailRow}>
          <Text style={styles.detailLabel}>{props.t(row.labelKey)}</Text>
          <Text style={styles.detailValue}>
            {row.value || props.t('coach.library.exercises.detail.empty')}
          </Text>
        </View>
      ))}
    </>
  );
}

function DescriptionRow(props: {
  description?: string | null;
  descriptionLabelKey?: string;
  t: (k: string) => string;
}): React.JSX.Element | null {
  if (!props.description) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {props.t(props.descriptionLabelKey ?? 'coach.library.exercises.detail.instructions')}
      </Text>
      <Text style={styles.detailValue}>{props.description}</Text>
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
