import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  buttonLabel: string;
  onPress: () => void;
  subtitle: string;
  title: string;
};

export function LibraryCreateCta(props: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.textBox}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.subtitle}>{props.subtitle}</Text>
      </View>
      <Pressable onPress={props.onPress} style={styles.button}>
        <Text style={styles.buttonLabel}>{props.buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: space.xl,
  },
  buttonLabel: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.lg,
    width: '100%',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  textBox: {
    flex: 1,
    gap: space.xs,
    maxWidth: 640,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
