import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import type { ProgressPose } from './client-measures.helpers';

type Props = { onCapture: (uri: string) => void; pose: ProgressPose };

export function ProgressPhotoCamera(props: Props): React.JSX.Element {
  void props;
  const { t } = useTranslation();
  return (
    <View style={styles.fill}>
      <Text style={styles.hint}>{t('client.measures.capture.webHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  hint: { color: LIGHT.textOnNavy, fontSize: 15, textAlign: 'center' },
});
