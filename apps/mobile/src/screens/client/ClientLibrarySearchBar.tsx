import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';

type Props = {
  onChange: (value: string) => void;
  value: string;
};

const INPUT_BG = 'rgba(0,0,0,0.4)';
const INPUT_BORDER = 'rgba(168,85,247,0.3)';
const INPUT_COLOR = '#ffffff';
const PLACEHOLDER_COLOR = 'rgba(196,181,253,0.5)';

export function LibrarySearchBar({ value, onChange }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [local, setLocal] = useState(value);

  const stableOnChange = useCallback((v: string) => onChange(v), [onChange]);

  useEffect(() => {
    const timer = setTimeout(() => stableOnChange(local), 350);
    return () => clearTimeout(timer);
  }, [local, stableOnChange]);

  return (
    <View style={styles.wrapper}>
      <TextInput
        onChangeText={setLocal}
        placeholder={t('client.library.searchPlaceholder')}
        placeholderTextColor={PLACEHOLDER_COLOR}
        style={styles.input}
        value={local}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: INPUT_COLOR,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wrapper: {
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 16,
  },
});
