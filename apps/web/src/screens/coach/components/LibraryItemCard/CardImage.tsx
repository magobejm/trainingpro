import React from 'react';
import { StyleSheet, View, Image, Text, DimensionValue } from 'react-native';

interface CardImageProps {
  name: string;
  imageUrl: string;
  subtitle?: string | null;
  scope?: 'coach' | 'global';
  t: (k: string) => string;
}

export function CardImage({ name, imageUrl, subtitle, scope, t }: CardImageProps) {
  const coachOwned = scope === 'coach';
  return (
    <View style={styles.imageContainer}>
      <Image accessibilityLabel={name} source={{ uri: imageUrl }} style={styles.image} />
      {subtitle && (
        <View style={styles.badgesOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{subtitle.toUpperCase()}</Text>
          </View>
        </View>
      )}
      {scope && (
        <View style={styles.scopeBadgeContainer}>
          <View style={[styles.scopeBadge, coachOwned ? styles.mineBadge : styles.globalBadge]}>
            <Text style={styles.scopeBadgeText}>
              {t(coachOwned ? 'coach.library.exercises.badge.mine' : 'coach.library.scope.global')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
  },
  image: {
    aspectRatio: 16 / 9,
    width: '100%' as DimensionValue,
    minHeight: 180,
    backgroundColor: '#f1f5f9',
  },
  badgesOverlay: {
    flexDirection: 'row',
    gap: 4,
    left: 10,
    position: 'absolute',
    top: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  scopeBadgeContainer: {
    bottom: 10,
    position: 'absolute',
    right: 10,
  },
  scopeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mineBadge: {
    backgroundColor: '#dbeafe',
  },
  globalBadge: {
    backgroundColor: '#f1f5f9',
  },
  scopeBadgeText: {
    color: '#1e293b',
    fontSize: 10,
    fontWeight: '600',
  },
});
