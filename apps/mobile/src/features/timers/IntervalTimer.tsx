import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
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
  const { isRunning, remaining, reset, toggle } = useCountdown(props.seconds);
  const label = useMemo(() => formatSeconds(remaining), [remaining]);
  return (
    <View style={styles.card}>
      <Text style={styles.time}>{label}</Text>
      <View style={styles.row}>
        <ActionButton
          label={isRunning ? props.pauseLabel : props.startLabel}
          onPress={toggle}
        />
        <ActionButton label={props.resetLabel} onPress={reset} />
      </View>
      <Text style={styles.running}>{isRunning ? props.runningLabel : props.startLabel}</Text>
    </View>
  );
}

function useCountdown(seconds: number) {
  const [isRunning, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = setInterval(() => {
      setRemaining((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);
  return {
    isRunning,
    remaining,
    reset: () => {
      setRunning(false);
      setRemaining(seconds);
    },
    toggle: () => setRunning((value) => !value),
  };
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
