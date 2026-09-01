import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

type ScaleKind = 'rir' | 'rpe';

type ScaleModalProps = {
  kind: ScaleKind;
  value: number;
  visible: boolean;
  onChange?: (value: number) => void;
  onClose: () => void;
  onSave?: (value: number) => void;
};

const CONFIG: Record<ScaleKind, { min: number; max: number; step: number; track: string }> = {
  rir: { min: 0, max: 10, step: 1, track: LIGHT.emerald },
  rpe: { min: 1, max: 10, step: 0.5, track: LIGHT.amber },
};

export function ScaleModal({ kind, value, visible, onChange, onClose, onSave }: ScaleModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const config = CONFIG[kind];
  const label = kind === 'rir' ? t('client.label.rir') : t('client.label.rpe');

  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const handleSave = () => {
    onSave?.(draft);
    onChange?.(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType={'fade'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.bigValue}>{kind === 'rpe' ? draft.toFixed(1) : String(draft)}</Text>
          <Slider
            minimumValue={config.min}
            maximumValue={config.max}
            step={config.step}
            value={draft}
            onValueChange={setDraft}
            minimumTrackTintColor={config.track}
            maximumTrackTintColor={LIGHT.borderStrong}
            thumbTintColor={config.track}
          />
          <Pressable style={styles.doneBtn} onPress={handleSave}>
            <Text style={styles.doneBtnText}>{t('client.finish.submit')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bigValue: {
    color: LIGHT.textStrong,
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  doneBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 20,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: LIGHT.textOnNavy,
    fontSize: 16,
    fontWeight: '700',
  },
});
