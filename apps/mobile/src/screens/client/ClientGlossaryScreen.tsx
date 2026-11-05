import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { SCREEN } from '../../theme/sessionStyles';
import { GlossaryList } from '../glossary/GlossaryList';

export function ClientGlossaryScreen(props: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={SCREEN.root}>
      <OverlayBackHeader onClose={props.onClose} title={t('mobile.client.more.glossary')} />
      <ScrollView contentContainerStyle={styles.page}>
        <GlossaryList />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
});
