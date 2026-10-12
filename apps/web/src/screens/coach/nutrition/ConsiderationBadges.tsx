import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export type NutritionConsideration = {
  code: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  tone: 'bad' | 'good' | 'neutral';
  values?: { x?: number };
  variant: number;
};

type Props = {
  items?: NutritionConsideration[];
  t: (key: string, options?: Record<string, unknown>) => string;
};

const CONSIDERATION_NAMESPACE = 'coach.nutrition.considerations';

export function ConsiderationBadges(props: Props): React.JSX.Element | null {
  const items = props.items ?? [];
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{props.t(`${CONSIDERATION_NAMESPACE}.title`)}</Text>
      {items.map((item) => (
        <View key={`${item.code}-${item.variant}`} style={[styles.badge, toneStyle(item.tone)]}>
          <Text style={styles.text}>
            {props.t(`${CONSIDERATION_NAMESPACE}.${item.code}.${item.variant}`, item.values ?? {})}
          </Text>
        </View>
      ))}
    </View>
  );
}

function toneStyle(tone: NutritionConsideration['tone']) {
  if (tone === 'bad') {
    return styles.bad;
  }
  if (tone === 'good') {
    return styles.good;
  }
  return styles.neutral;
}

const styles = StyleSheet.create({
  bad: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  badge: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  good: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
  },
  text: {
    color: colors.text,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  wrap: {
    gap: space.sm,
    marginTop: space.md,
  },
});
