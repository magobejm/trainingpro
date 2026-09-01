import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

type WorkoutClockProps = {
  startedAt: null | string;
  onFinish: () => void;
};

const DOT_ANIM_DURATION = 800;
const PAD = '0';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, PAD)}:${String(seconds).padStart(2, PAD)}`;
}

export function WorkoutClock({ startedAt, onFinish }: WorkoutClockProps) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDotPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.2, duration: DOT_ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: DOT_ANIM_DURATION, useNativeDriver: true }),
      ]),
    ).start();
  }, [dotOpacity]);

  useEffect(() => {
    if (!startedAt) return;
    const base = new Date(startedAt).getTime();
    const update = () => setElapsed(Date.now() - base);
    update();
    intervalRef.current = setInterval(update, 1000);
    startDotPulse();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, startDotPulse]);

  if (!startedAt) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
        <Text style={styles.time}>{t('client.workoutClock.elapsed', { time: formatElapsed(elapsed) })}</Text>
      </View>
      <Pressable style={styles.btn} onPress={onFinish}>
        <Text style={styles.btnText}>{t('client.workoutClock.finish')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    backgroundColor: LIGHT.redBg,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  time: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: LIGHT.redBg,
    borderRadius: LIGHT.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
});
