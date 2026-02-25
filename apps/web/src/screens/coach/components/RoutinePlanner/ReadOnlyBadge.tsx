import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ReadOnlyBadgeProps {
  t: (k: string) => string;
}

export function ReadOnlyBadge({ t }: ReadOnlyBadgeProps) {
  return (
    <View style={styles.readOnlyBadge}>
      <Text style={styles.readOnlyText}>{t('coach.routine.readOnlyNotice')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readOnlyBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  readOnlyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
