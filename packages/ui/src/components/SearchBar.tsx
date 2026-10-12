import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  onChangeText: (text: string) => void;
  placeholder: string;
  value: string;
};

const COLORS = {
  border: colors.border,
  input: colors.text,
  shell: colors.surface,
};

export function SearchBar(props: Props): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <TextInput
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: COLORS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wrapper: {
    backgroundColor: COLORS.shell,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
});
