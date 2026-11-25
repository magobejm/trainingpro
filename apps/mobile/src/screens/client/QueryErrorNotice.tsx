import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';

/** Aviso de carga fallida con botón para reintentar. */
export function QueryErrorNotice({ onRetry }: { onRetry: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{t('mobile.state.error')}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
        <Text style={styles.label}>{t('mobile.state.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: LIGHT.accent,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  label: { color: LIGHT.textOnNavy, fontWeight: '700' },
  text: { color: LIGHT.textMuted, fontSize: 14 },
  wrap: { alignItems: 'center', gap: 12, padding: 24 },
});
