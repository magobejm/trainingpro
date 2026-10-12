import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Modal, TextField, colors, fontSize, space } from '@trainerpro/ui';

interface SeriesNoteModalProps {
  visible: boolean;
  seriesIndex: number;
  value: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function SeriesNoteModal({ visible, seriesIndex, value, onClose, onSave }: SeriesNoteModalProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);

  useEffect(() => {
    if (visible) setText(value);
  }, [visible, value]);

  const handleSave = () => {
    onSave(text.trim());
    onClose();
  };

  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <>
          {text.trim() ? (
            <Button
              label={t('coach.routine.seriesNote.clear')}
              onPress={() => {
                onSave('');
                onClose();
              }}
              variant="danger"
            />
          ) : null}
          <View style={st.spacer} />
          <Button label={t('coach.routine.delete.cancel')} onPress={onClose} variant="secondary" />
          <Button label={t('coach.routine.seriesNote.save')} onPress={handleSave} />
        </>
      }
      onClose={onClose}
      title={t('coach.routine.seriesNote.title', { n: seriesIndex + 1 })}
      visible={visible}
    >
      <View style={st.body}>
        <Text style={st.hint}>{t('coach.routine.seriesNote.hint')}</Text>
        <TextField
          multiline
          numberOfLines={5}
          onChangeText={setText}
          placeholder={t('coach.routine.seriesNote.placeholder')}
          value={text}
        />
      </View>
    </Modal>
  );
}

const st = {
  body: { gap: space.md },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
  spacer: { flex: 1 },
};
