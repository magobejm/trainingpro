import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import {
  clampSessionRpe,
  DEFAULT_SESSION_RPE,
  formatSessionRpe,
  SESSION_RPE_MAX,
  SESSION_RPE_MIN,
  SESSION_RPE_STEP,
  SESSION_RPE_STEPS,
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
  const [draft, setDraft] = useState(DEFAULT_SESSION_RPE);

  useEffect(() => {
    if (props.visible) {
      setDraft(DEFAULT_SESSION_RPE);
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
            disabled={props.isSubmitting}
            onPress={() => props.onSubmit(draft)}
            style={[styles.saveBtn, props.isSubmitting ? styles.saveBtnDisabled : null]}
          >
            <Text style={styles.saveText}>{t('mobile.client.rpe.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SessionRpeCard(props: { draft: number; onChange: (value: number) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const band = sessionRpeBand(props.draft);
  const label = t(`mobile.client.rpe.band.${band.key}.label`);
  const hint = t(`mobile.client.rpe.band.${band.key}.hint`);

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{t('mobile.client.rpe.question')}</Text>
      <Text style={styles.help}>{t('mobile.client.rpe.help')}</Text>
      <View style={styles.valueRow}>
        <Pressable onPress={() => props.onChange(clampSessionRpe(props.draft - SESSION_RPE_STEP))} style={styles.stepBtn}>
          <Text style={styles.stepText}>{'-0.5'}</Text>
        </Pressable>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>
            {formatSessionRpe(props.draft)}
            <Text style={styles.valueMax}>{' / 10'}</Text>
          </Text>
        </View>
        <Pressable onPress={() => props.onChange(clampSessionRpe(props.draft + SESSION_RPE_STEP))} style={styles.stepBtn}>
          <Text style={styles.stepText}>{'+0.5'}</Text>
        </Pressable>
      </View>
      <View style={[styles.band, { backgroundColor: band.bg, borderColor: band.border }]}>
        <Text style={[styles.bandText, { color: band.text }]}>
          {`${label} • `}
          <Text style={styles.bandHint}>{hint}</Text>
        </Text>
      </View>
      <Slider
        maximumTrackTintColor={LIGHT.indigoSoft}
        maximumValue={SESSION_RPE_MAX}
        minimumTrackTintColor={LIGHT.indigo}
        minimumValue={SESSION_RPE_MIN}
        onValueChange={(value) => props.onChange(clampSessionRpe(value))}
        step={SESSION_RPE_STEP}
        thumbTintColor={LIGHT.indigo}
        value={props.draft}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{t('mobile.client.rpe.sliderMin')}</Text>
        <Text style={styles.sliderLabel}>{t('mobile.client.rpe.sliderMid')}</Text>
        <Text style={styles.sliderLabel}>{t('mobile.client.rpe.sliderMax')}</Text>
      </View>
      <Text style={styles.quickLabel}>{t('mobile.client.rpe.quickSelect')}</Text>
      <View style={styles.chips}>
        {SESSION_RPE_STEPS.map((value) => {
          const selected = value === props.draft;
          return (
            <Pressable
              key={value}
              onPress={() => props.onChange(value)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{formatSessionRpe(value)}</Text>
            </Pressable>
          );
        })}
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
  chip: {
    backgroundColor: LIGHT.indigoSoft,
    borderColor: LIGHT.indigoSoft,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: LIGHT.indigo, borderColor: LIGHT.indigo },
  chipText: { color: LIGHT.text, fontSize: 12, fontWeight: '800' },
  chipTextSelected: { color: LIGHT.textOnNavy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
  quickLabel: {
    color: LIGHT.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
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
  sliderLabel: { color: LIGHT.indigo, fontSize: 10, fontWeight: '800' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 6 },
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
  value: { color: LIGHT.textStrong, fontSize: 32, fontWeight: '900' },
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
