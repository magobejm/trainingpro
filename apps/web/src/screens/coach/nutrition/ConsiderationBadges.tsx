import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  good: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  neutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  text: {
    color: '#1e293b',
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    color: '#334e70',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  wrap: {
    gap: 8,
    marginTop: 10,
  },
});
