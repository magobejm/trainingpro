import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { WellnessScoreRow } from './WellnessScoreRow';

export type StartCheckinScores = {
  preFatigue: number;
  preMotivation: number;
  preRecovery: number;
};

type Props = {
  isSubmitting: boolean;
  visible: boolean;
  onSkip: () => void;
  onSubmit: (scores: StartCheckinScores) => void;
};

const DEFAULT_SCORE = 5;

export function SessionStartCheckinSheet(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [motivation, setMotivation] = useState(DEFAULT_SCORE);
  const [recovery, setRecovery] = useState(DEFAULT_SCORE);
  const [fatigue, setFatigue] = useState(DEFAULT_SCORE);

  useEffect(() => {
    if (props.visible) {
      setMotivation(DEFAULT_SCORE);
      setRecovery(DEFAULT_SCORE);
      setFatigue(DEFAULT_SCORE);
    }
  }, [props.visible]);

  return (
    <Modal animationType={'fade'} onRequestClose={props.onSkip} transparent visible={props.visible}>
      <Pressable onPress={props.onSkip} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <Text style={styles.title}>{t('client.wellnessPre.title')}</Text>
          <WellnessScoreRow label={t('client.wellnessPre.motivation')} onChange={setMotivation} value={motivation} />
          <WellnessScoreRow label={t('client.wellnessPre.recovery')} onChange={setRecovery} value={recovery} />
          <WellnessScoreRow label={t('client.wellnessPre.fatigue')} onChange={setFatigue} value={fatigue} />
          <View style={styles.actions}>
            <Pressable disabled={props.isSubmitting} onPress={props.onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t('client.wellnessPre.skip')}</Text>
            </Pressable>
            <Pressable
              disabled={props.isSubmitting}
              onPress={() => props.onSubmit({ preFatigue: fatigue, preMotivation: motivation, preRecovery: recovery })}
              style={styles.saveBtn}
            >
              <Text style={styles.saveText}>{t('client.wellnessPre.save')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
    gap: 12,
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
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 4 },
});
