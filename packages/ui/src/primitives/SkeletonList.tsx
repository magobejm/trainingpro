import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '../theme/tokens';
import { Skeleton } from './Skeleton';

export type SkeletonVariant = 'cards' | 'panel' | 'rows';

const CARD_COUNT = 4;
const ROW_COUNT = 4;

export function SkeletonList(props: { variant: SkeletonVariant }): React.JSX.Element {
  if (props.variant === 'panel') return <Skeleton height={180} radius={radius.lg} />;
  if (props.variant === 'rows') {
    return (
      <View style={styles.stack}>
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <SkeletonRow key={index} />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.grid}>
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

function SkeletonCard(): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Skeleton height={96} radius={radius.md} />
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="45%" />
    </View>
  );
}

function SkeletonRow(): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Skeleton height={40} radius={radius.pill} width={40} />
      <View style={styles.lines}>
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} width="35%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: 220, flexGrow: 1, gap: space.sm, maxWidth: 280 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, width: '100%' },
  lines: { flex: 1, gap: space.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: space.md },
  stack: { gap: space.lg, width: '100%' },
});
