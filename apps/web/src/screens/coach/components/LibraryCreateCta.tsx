import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#1c74e9',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f5',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    width: '100%',
  },
  subtitle: {
    color: '#627285',
    fontSize: 14,
  },
  textBox: {
    flex: 1,
    gap: 4,
    maxWidth: 640,
  },
  title: {
    color: '#0e1a2f',
    fontSize: 24,
    fontWeight: '800',
  },
});
