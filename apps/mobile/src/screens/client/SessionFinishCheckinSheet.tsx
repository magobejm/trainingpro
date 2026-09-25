import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { WellnessScoreRow } from './WellnessScoreRow';

export type FinishCheckinPayload = {
  comment: null | string;
  isIncomplete: boolean;
  postFatigue: number;
  postMood: number;
  postPain: number;
};

type Props = {
  isSubmitting: boolean;
  visible: boolean;
  onSkip: () => void;
  onSubmit: (payload: FinishCheckinPayload) => void;
};

const DEFAULT_SCORE = 5;

export function SessionFinishCheckinSheet(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [mood, setMood] = useState(DEFAULT_SCORE);
  const [fatigue, setFatigue] = useState(DEFAULT_SCORE);
  const [pain, setPain] = useState(DEFAULT_SCORE);
  const [comment, setComment] = useState('');
  const [isIncomplete, setIsIncomplete] = useState(false);

  useEffect(() => {
    if (props.visible) {
      setMood(DEFAULT_SCORE);
      setFatigue(DEFAULT_SCORE);
      setPain(DEFAULT_SCORE);
      setComment('');
      setIsIncomplete(false);
    }
  }, [props.visible]);

  const payload: FinishCheckinPayload = {
    comment: comment.trim() || null,
    isIncomplete,
    postFatigue: fatigue,
    postMood: mood,
    postPain: pain,
  };

  return (
    <Modal animationType={'fade'} onRequestClose={props.onSkip} transparent visible={props.visible}>
      <Pressable onPress={props.onSkip} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps={'handled'}>
            <Text style={styles.title}>{t('client.wellnessPost.title')}</Text>
            <WellnessScoreRow label={t('client.wellnessPost.mood')} onChange={setMood} value={mood} />
            <WellnessScoreRow label={t('client.wellnessPost.fatigue')} onChange={setFatigue} value={fatigue} />
            <WellnessScoreRow label={t('client.wellnessPost.pain')} onChange={setPain} value={pain} />
            <Text style={styles.fieldLabel}>{t('client.wellnessPost.comment')}</Text>
            <TextInput
              multiline
              onChangeText={setComment}
              placeholder={t('client.wellnessPost.commentPlaceholder')}
              placeholderTextColor={LIGHT.textMuted}
              style={styles.input}
              value={comment}
            />
            <Pressable onPress={() => setIsIncomplete((value) => !value)} style={styles.toggle}>
              <Text style={styles.toggleText}>
                {isIncomplete ? t('client.finish.incompleteOn') : t('client.finish.incompleteOff')}
              </Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable disabled={props.isSubmitting} onPress={props.onSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>{t('client.wellnessPre.skip')}</Text>
              </Pressable>
              <Pressable disabled={props.isSubmitting} onPress={() => props.onSubmit(payload)} style={styles.saveBtn}>
                <Text style={styles.saveText}>{t('client.wellnessPost.submit')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  fieldLabel: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    marginTop: 6,
    minHeight: 72,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  saveText: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '700' },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    maxHeight: '90%',
    padding: 24,
    width: '100%',
  },
  skipBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  skipText: { color: LIGHT.accentDark, fontSize: 14, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  toggle: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    marginTop: 12,
    paddingVertical: 10,
  },
  toggleText: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '700' },
});
