import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIM = 'fade' as const;
const ICON_CLOSE = '✕';
const PLACEHOLDER_TEXT_COLOR = colors.borderStrong;

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
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent visible={visible}>
      <View style={st.overlay}>
        <View style={st.dialog}>
          <View style={st.header}>
            <Text style={st.title}>{t('coach.routine.seriesNote.title', { n: seriesIndex + 1 })}</Text>
            <TouchableOpacity onPress={onClose} style={st.closeBtn}>
              <Text style={st.closeIcon}>{ICON_CLOSE}</Text>
            </TouchableOpacity>
          </View>

          <View style={st.body}>
            <Text style={st.hint}>{t('coach.routine.seriesNote.hint')}</Text>
            <TextInput
              autoFocus
              multiline
              numberOfLines={5}
              onChangeText={setText}
              placeholder={t('coach.routine.seriesNote.placeholder')}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              style={st.textarea}
              value={text}
            />
          </View>

          <View style={st.footer}>
            {text.trim() ? (
              <TouchableOpacity
                onPress={() => {
                  onSave('');
                  onClose();
                }}
                style={st.clearBtn}
              >
                <Text style={st.clearBtnText}>{t('coach.routine.seriesNote.clear')}</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={st.cancelBtn}>
              <Text style={st.cancelBtnText}>{t('coach.routine.delete.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={st.saveBtn}>
              <Text style={st.saveBtnText}>{t('coach.routine.seriesNote.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: space.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%' as const,
    maxWidth: 500,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: { fontSize: fontSize.md, fontWeight: '700' as const, color: colors.text },
  closeBtn: { padding: space.xs },
  closeIcon: { fontSize: fontSize.lg, color: colors.textMuted },
  body: {
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    gap: space.md,
  },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    backgroundColor: colors.surfaceMuted,
    gap: space.md,
  },
  clearBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  clearBtnText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '500' as const },
  cancelBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  cancelBtnText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' as const },
  saveBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveBtnText: { fontSize: fontSize.sm, color: colors.surface, fontWeight: '600' as const },
};
