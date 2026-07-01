import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';

type Props = {
  onChange: (value: string) => void;
  value: string;
};

const INPUT_BG = LIGHT.bgCard;
const INPUT_BORDER = LIGHT.border;
const INPUT_COLOR = LIGHT.textStrong;
const PLACEHOLDER_COLOR = LIGHT.textMuted;

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
