import React, { useState } from 'react';
import { Modal, SafeAreaView, View, Text, Platform, StatusBar, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoachClientsScreen } from '../../screens/coach/CoachClientsScreen';
import { CoachButton, ui } from './CoachUi';

export function CoachClientCardsPicker({
  label,
  onChange,
  optional,
}: {
  label: string;
  onChange: (id: string) => void;
  optional: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };
  return (
    <>
      <Text style={ui.label}>{t('coachWorkspace.client')}</Text>
      <CoachButton label={label} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType={'slide'} onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[ui.page, styles.safe]}>
          <View style={ui.content}>
            <CoachButton label={t('coachWorkspace.cancel')} onPress={() => setOpen(false)} />
            {optional ? <CoachButton label={t('coachWorkspace.allClients')} onPress={() => choose('')} /> : null}
          </View>
          <CoachClientsScreen selecting onSelect={choose} />
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({ safe: { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0 } });
