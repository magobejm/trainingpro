import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';

type Props = {
  initialSeconds: number;
  label: string;
  pauseLabel: string;
  resetLabel: string;
  startLabel: string;
};

export function RestTimer(props: Props): React.JSX.Element {
  const [seconds, setSeconds] = useState(props.initialSeconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.label}</Text>
      <Text style={styles.value}>{formatTime(seconds)}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => setRunning((value) => !value)} style={styles.button}>
          <Text style={styles.buttonLabel}>{running ? props.pauseLabel : props.startLabel}</Text>
        </Pressable>
        <Pressable onPress={() => setSeconds(props.initialSeconds)} style={styles.ghost}>
          <Text style={styles.ghostLabel}>{props.resetLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  const mm = `${Math.floor(seconds / 60)}`.padStart(2, '0');
  const ss = `${seconds % 60}`.padStart(2, '0');
  return `${mm}:${ss}`;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 88,
    paddingHorizontal: 12,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  ghost: {
    alignItems: 'center',
    borderColor: '#d8e1ee',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 88,
    paddingHorizontal: 12,
  },
  ghostLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  value: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
});
