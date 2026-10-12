import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';

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
      <Button label={props.buttonLabel} onPress={props.onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
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
