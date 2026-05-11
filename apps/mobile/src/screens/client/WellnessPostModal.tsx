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

const MODAL_ANIMATION = 'slide';
const KEYBOARD_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;
const KEYBOARD_TYPE = 'default';
const KEYBOARD_PERSIST_TAPS = 'handled';
const SLIDER_ACTIVE = '#6366f1';
const SLIDER_TRACK = '#334155';
const SLIDER_THUMB = '#6366f1';
const PLACEHOLDER_COLOR = '#64748b';

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
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  commentLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 16,
  },
  submitBtnText: {
    color: '#fff',
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
    color: '#cbd5e1',
    fontSize: 14,
  },
  value: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
});
