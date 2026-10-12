import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { remainingSeconds, rewindEndAt } from './countdown';

type Props = {
  onComplete?: () => void;
  pauseLabel: string;
  resetLabel: string;
  runningLabel: string;
  seconds: number;
  startLabel: string;
};

const COLORS = {
  accent: '#225fdb',
  border: '#d8e1ee',
  text: '#11213a',
  white: '#ffffff',
};

export function IntervalTimer(props: Props): React.JSX.Element {
  const { isRunning, remaining, reset, toggle } = useCountdown(props.seconds, props.onComplete);
  const label = useMemo(() => formatSeconds(remaining), [remaining]);
  return (
    <View style={styles.card}>
      <Text style={styles.time}>{label}</Text>
      <View style={styles.row}>
        <ActionButton label={isRunning ? props.pauseLabel : props.startLabel} onPress={toggle} />
        <ActionButton label={props.resetLabel} onPress={reset} />
      </View>
      <Text style={styles.running}>{isRunning ? props.runningLabel : props.startLabel}</Text>
    </View>
  );
}

function useCountdown(seconds: number, onComplete?: () => void) {
  const [isRunning, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  const lastSeenRef = useRef(Date.now());
  const endAtRef = useRef<number | null>(null);
  const remainingRef = useRef(seconds);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;
  endAtRef.current = endAt;
  remainingRef.current = remaining;

  useEffect(() => {
    completedRef.current = false;
    remainingRef.current = seconds;
    endAtRef.current = null;
    setRemaining(seconds);
    setEndAt(null);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || endAt == null) return;
    const tick = () => {
      const now = Date.now();
      let currentEnd = endAtRef.current ?? endAt;
      if (now < lastSeenRef.current) {
        currentEnd = rewindEndAt(currentEnd, lastSeenRef.current, now);
        endAtRef.current = currentEnd;
        setEndAt(currentEnd);
      }
      lastSeenRef.current = now;
      const next = remainingSeconds(currentEnd, seconds, now);
      remainingRef.current = next;
      setRemaining(next);
      if (next > 0 || completedRef.current) return;
      completedRef.current = true;
      setRunning(false);
      onCompleteRef.current?.();
    };
    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [endAt, isRunning, seconds]);

  const reset = () => {
    completedRef.current = false;
    remainingRef.current = seconds;
    endAtRef.current = null;
    setRunning(false);
    setEndAt(null);
    setRemaining(seconds);
  };
  const toggle = () => {
    if (isRunning) {
      const currentEnd = endAtRef.current;
      const left = currentEnd == null ? remainingRef.current : remainingSeconds(currentEnd, seconds, Date.now());
      remainingRef.current = left;
      endAtRef.current = null;
      setRemaining(left);
      setEndAt(null);
      setRunning(false);
      return;
    }
    const nextEnd = Date.now() + remainingRef.current * 1000;
    lastSeenRef.current = Date.now();
    completedRef.current = false;
    endAtRef.current = nextEnd;
    setEndAt(nextEnd);
    setRunning(true);
  };
  return { isRunning, remaining, reset, toggle };
}

function ActionButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{props.label}</Text>
    </Pressable>
  );
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 96,
    paddingHorizontal: 10,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  running: {
    color: COLORS.text,
    fontSize: 12,
  },
  time: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
