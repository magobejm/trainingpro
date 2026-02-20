import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type FieldModeValue = 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN';

type Option = {
  label: string;
  value: FieldModeValue;
};

type Props = {
  onChange: (value: FieldModeValue) => void;
  options: Option[];
  value: FieldModeValue;
};

const COLORS = {
  activeBg: '#225fdb',
  activeText: '#ffffff',
  border: '#d8e1ee',
  text: '#11213a',
};

export function FieldModeControl(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {props.options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => props.onChange(option.value)}
          style={resolveButtonStyle(option.value === props.value)}
        >
          <Text style={resolveLabelStyle(option.value === props.value)}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function resolveButtonStyle(active: boolean) {
  return [styles.button, active ? styles.buttonActive : null];
}

function resolveLabelStyle(active: boolean) {
  return [styles.label, active ? styles.labelActive : null];
}

const styles = StyleSheet.create({
  button: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonActive: {
    backgroundColor: COLORS.activeBg,
    borderColor: COLORS.activeBg,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: {
    color: COLORS.activeText,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
