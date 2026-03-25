import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const MODAL_ANIM = 'fade' as const;
const ICON_CLOSE = '✕';
const PLACEHOLDER_TEXT_COLOR = '#cbd5e1';

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
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%' as const,
    maxWidth: 500,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontWeight: '700' as const, color: '#1e293b' },
  closeBtn: { padding: 4 },
  closeIcon: { fontSize: 18, color: '#94a3b8' },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  hint: { fontSize: 13, color: '#64748b' },
  textarea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
  },
  clearBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '500' as const },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { fontSize: 13, color: '#64748b', fontWeight: '500' as const },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' as const },
};
