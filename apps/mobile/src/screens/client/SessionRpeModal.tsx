import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { completeRpeValue, sanitizeRpeInput } from './effort-input.utils';
import {
  clampSessionRpe,
  DEFAULT_SESSION_RPE,
  formatSessionRpe,
  SESSION_RPE_STEP,
  sessionRpeBand,
} from './session-rpe.utils';

type Props = {
  isSubmitting: boolean;
  visible: boolean;
  onClose: () => void;
  onSubmit: (sessionRpe: number) => void;
};

export function SessionRpeModal(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(formatSessionRpe(DEFAULT_SESSION_RPE));
  const sessionRpe = completeRpeValue(draft);

  useEffect(() => {
    if (props.visible) {
      setDraft(formatSessionRpe(DEFAULT_SESSION_RPE));
    }
  }, [props.visible]);

  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable onPress={props.onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'✕'}</Text>
          </Pressable>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{'⏱️'}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('mobile.client.rpe.title')}</Text>
              <Text style={styles.subtitle}>{t('mobile.client.rpe.subtitle')}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <SessionRpeCard draft={draft} onChange={setDraft} />
          </ScrollView>
          <Pressable
            disabled={props.isSubmitting || sessionRpe == null}
            onPress={() => {
              if (sessionRpe == null) return;
              props.onSubmit(sessionRpe);
            }}
            style={[styles.saveBtn, props.isSubmitting || sessionRpe == null ? styles.saveBtnDisabled : null]}
          >
            <Text style={styles.saveText}>{t('mobile.client.rpe.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SessionRpeCard(props: { draft: string; onChange: (value: string) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const current = completeRpeValue(props.draft) ?? DEFAULT_SESSION_RPE;
  const band = sessionRpeBand(current);
  const label = t(`mobile.client.rpe.band.${band.key}.label`);
  const hint = t(`mobile.client.rpe.band.${band.key}.hint`);
  const step = (delta: number) => {
    const base = completeRpeValue(props.draft) ?? completeRpeValue(props.draft.replace(/[.,]$/, '')) ?? DEFAULT_SESSION_RPE;
    props.onChange(formatSessionRpe(clampSessionRpe(base + delta)));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{t('mobile.client.rpe.question')}</Text>
      <Text style={styles.help}>{t('mobile.client.rpe.help')}</Text>
      <View style={styles.valueRow}>
        <Pressable onPress={() => step(-SESSION_RPE_STEP)} style={styles.stepBtn}>
          <Text style={styles.stepText}>{'-0.5'}</Text>
        </Pressable>
        <View style={styles.valueWrap}>
          <TextInput
            keyboardType={'decimal-pad'}
            onChangeText={(value) => props.onChange(sanitizeRpeInput(value))}
            style={styles.value}
            value={props.draft}
          />
          <Text style={styles.valueMax}>{'/ 10'}</Text>
        </View>
        <Pressable onPress={() => step(SESSION_RPE_STEP)} style={styles.stepBtn}>
          <Text style={styles.stepText}>{'+0.5'}</Text>
        </Pressable>
      </View>
      <View style={[styles.band, { backgroundColor: band.bg, borderColor: band.border }]}>
        <Text style={[styles.bandText, { color: band.text }]}>
          {`${label} • `}
          <Text style={styles.bandHint}>{hint}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  band: { borderRadius: 12, borderWidth: 1, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 10 },
  bandHint: { fontWeight: '500', opacity: 0.9 },
  bandText: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#eef2ff99',
    borderColor: LIGHT.indigoSoft,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    padding: 16,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    zIndex: 2,
  },
  closeText: { color: LIGHT.accent, fontSize: 14, fontWeight: '700' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16, paddingRight: 32 },
  headerText: { flex: 1 },
  help: { color: LIGHT.accent, fontSize: 12, fontWeight: '600', marginBottom: 16 },
  icon: { fontSize: 18 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT.indigoSoft,
    borderRadius: LIGHT.radiusLg,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  question: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.indigo,
    borderRadius: LIGHT.radiusLg,
    marginTop: 8,
    paddingVertical: 14,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '800' },
  scroll: { paddingBottom: 8 },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 32,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 24,
    width: '100%',
  },
  stepBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.indigoSoft,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 48,
  },
  stepText: { color: LIGHT.text, fontSize: 12, fontWeight: '800' },
  subtitle: { color: LIGHT.indigo, fontSize: 12, fontWeight: '600' },
  title: { color: LIGHT.textStrong, fontSize: 17, fontWeight: '800' },
  value: {
    color: LIGHT.textStrong,
    fontSize: 32,
    fontWeight: '900',
    minWidth: 72,
    padding: 0,
    textAlign: 'center',
  },
  valueMax: { color: LIGHT.indigo, fontSize: 14, fontWeight: '800' },
  valueRow: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.indigoSoft,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
  },
  valueWrap: { alignItems: 'center' },
});
