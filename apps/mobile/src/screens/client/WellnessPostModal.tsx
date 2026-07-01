import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

const MODAL_ANIMATION = 'slide';
const KEYBOARD_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;
const KEYBOARD_TYPE = 'default';
const KEYBOARD_PERSIST_TAPS = 'handled';
const SLIDER_ACTIVE = LIGHT.accent;
const SLIDER_TRACK = LIGHT.borderStrong;
const SLIDER_THUMB = LIGHT.accent;
const PLACEHOLDER_COLOR = LIGHT.textMuted;

type WellnessPostModalProps = {
  visible: boolean;
  onSubmit: (values: { fatigue: number; pain: number; mood: number; comment: string }) => void;
  onCancel: () => void;
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

export function WellnessPostModal({ visible, onSubmit, onCancel }: WellnessPostModalProps) {
  const { t } = useTranslation();
  const [fatigue, setFatigue] = useState(5);
  const [pain, setPain] = useState(5);
  const [mood, setMood] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = () => onSubmit({ fatigue, pain, mood, comment });

  return (
    <Modal visible={visible} transparent animationType={MODAL_ANIMATION} onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={KEYBOARD_BEHAVIOR}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('client.wellnessPost.title')}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={KEYBOARD_PERSIST_TAPS}>
            <WellnessSlider label={t('client.wellnessPost.fatigue')} value={fatigue} onChange={setFatigue} />
            <WellnessSlider label={t('client.wellnessPost.pain')} value={pain} onChange={setPain} />
            <WellnessSlider label={t('client.wellnessPost.mood')} value={mood} onChange={setMood} />
            <Text style={styles.commentLabel}>{t('client.wellnessPost.comment')}</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={3}
              placeholder={t('client.wellnessPost.commentPlaceholder')}
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={comment}
              onChangeText={setComment}
              keyboardType={KEYBOARD_TYPE}
            />
          </ScrollView>
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>{t('client.wellnessPost.submit')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderTopLeftRadius: LIGHT.radius2xl,
    borderTopRightRadius: LIGHT.radius2xl,
    maxHeight: '85%',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  commentLabel: {
    color: LIGHT.text,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 8,
    paddingVertical: 16,
  },
  submitBtnText: {
    color: LIGHT.textOnNavy,
    fontSize: 16,
    fontWeight: '700',
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
    color: LIGHT.text,
    fontSize: 14,
  },
  value: {
    color: LIGHT.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
