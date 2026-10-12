import React from 'react';
import { StyleSheet, View, Image, Text, DimensionValue } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

interface CardImageProps {
  name: string;
  imageUrl: string;
  subtitle?: string | null;
  scope?: 'coach' | 'global';
  t: (k: string) => string;
}

const IMAGE_BLUR_RADIUS = 16;

export function CardImage({ imageUrl, subtitle }: CardImageProps) {
  return (
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

      {subtitle && (
        <View style={styles.badgesOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{subtitle.toUpperCase()}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  badgesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  badgeText: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
