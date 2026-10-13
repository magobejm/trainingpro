import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { motion, useReducedMotion } from 'framer-motion';
import { colors, fontSize, space } from '@trainerpro/ui';
import type { ProgressRecord } from '@trainerpro/shared';

const SEEN_KEY = 'trainerpro.record.badge';

export function RecordBadge(props: { record: ProgressRecord; t: (key: string) => string }): React.JSX.Element {
  const reduced = useReducedMotion();
  const [alreadySeen] = useState(() => sessionStorage.getItem(SEEN_KEY) === '1');
  useEffect(() => {
    sessionStorage.setItem(SEEN_KEY, '1');
  }, []);
  const label = props.t('coach.progress.record.badge');
  const detail = `${props.record.exerciseName}: ${props.record.e1rm} kg`;
  if (reduced || alreadySeen) return <Badge detail={detail} label={label} />;
  return (
    <motion.div animate={{ scale: 1 }} initial={{ scale: 0.9 }} transition={{ duration: 0.35 }}>
      <Badge detail={detail} label={label} />
    </motion.div>
  );
}

function Badge(props: { detail: string; label: string }): React.JSX.Element {
  return (
    <View accessibilityLabel={`${props.label}. ${props.detail}`} style={styles.badge}>
      <Text style={styles.label}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  label: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
});
