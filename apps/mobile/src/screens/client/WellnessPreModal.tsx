import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

const MODAL_ANIMATION = 'slide';
const SLIDER_ACTIVE = '#6366f1';
const SLIDER_TRACK = '#334155';
const SLIDER_THUMB = '#6366f1';

type WellnessPreModalProps = {
  visible: boolean;
  onSave: (values: { motivation: number; recovery: number; fatigue: number }) => void;
  onSkip: () => void;
};

type WellnessSliderProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
};

function WellnessSlider({ label, value, onChange }: WellnessSliderProps) {
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.row}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value}</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={SLIDER_ACTIVE}
        maximumTrackTintColor={SLIDER_TRACK}
        thumbTintColor={SLIDER_THUMB}
      />
    </View>
  );
}

export function WellnessPreModal({ visible, onSave, onSkip }: WellnessPreModalProps) {
  const { t } = useTranslation();
  const [motivation, setMotivation] = useState(5);
  const [recovery, setRecovery] = useState(5);
  const [fatigue, setFatigue] = useState(5);

  const handleSave = () => onSave({ motivation, recovery, fatigue });

  return (
    <Modal visible={visible} transparent animationType={MODAL_ANIMATION} onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('client.wellnessPre.title')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <WellnessSlider label={t('client.wellnessPre.motivation')} value={motivation} onChange={setMotivation} />
            <WellnessSlider label={t('client.wellnessPre.recovery')} value={recovery} onChange={setRecovery} />
            <WellnessSlider label={t('client.wellnessPre.fatigue')} value={fatigue} onChange={setFatigue} />
          </ScrollView>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{t('client.wellnessPre.save')}</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>{t('client.wellnessPre.skip')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
  },
});

const sliderStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  value: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
});
