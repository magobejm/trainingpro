import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SuccessBannerProps {
  t: (k: string) => string;
}

export function SuccessBanner({ t }: SuccessBannerProps) {
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successText}>{t('coach.routine.saved')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
