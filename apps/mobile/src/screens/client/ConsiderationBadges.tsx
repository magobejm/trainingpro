import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LIGHT } from '../../theme/light';

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

export function ConsiderationBadges(props: Props): React.JSX.Element | null {
  const items = props.items ?? [];
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={`${item.code}-${item.variant}`} style={[styles.badge, toneStyle(item.tone)]}>
          <Text style={styles.text}>
            {props.t(`client.nutrition.considerations.${item.code}.${item.variant}`, item.values ?? {})}
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
    backgroundColor: LIGHT.redSoft,
    borderColor: LIGHT.error,
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  good: {
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: LIGHT.emerald,
  },
  neutral: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
  },
  text: {
    color: LIGHT.textStrong,
    fontSize: 12,
    lineHeight: 16,
  },
  wrap: {
    gap: 6,
    marginTop: 8,
    width: '100%',
  },
});
