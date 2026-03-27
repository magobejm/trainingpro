import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const MODAL_ANIM = 'fade' as const;
const PLACEHOLDER_COLOR = '#94a3b8';

interface SaveWarmupModalProps {
  initialName: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  t: (k: string) => string;
  visible: boolean;
}

export function SaveWarmupModal({ initialName, isSaving, onClose, onSave, t, visible }: SaveWarmupModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent visible={visible}>
      <View style={ss.overlay}>
        <View style={ss.container}>
          <Text style={ss.title}>{t('coach.warmupPlanner.saveModal.title')}</Text>

          <Text style={ss.label}>{t('coach.warmupPlanner.name')}</Text>
          <TextInput
            onChangeText={setName}
            placeholder={t('coach.warmupPlanner.namePlaceholder')}
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={ss.input}
            value={name}
          />

          <View style={ss.actions}>
            <Pressable onPress={onClose} style={ss.cancelBtn}>
              <Text style={ss.cancelBtnText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              disabled={!name.trim() || isSaving}
              onPress={() => onSave(name.trim())}
              style={[ss.saveBtn, (!name.trim() || isSaving) && ss.saveBtnDisabled]}
            >
              <Text style={ss.saveBtnText}>
                {isSaving ? t('coach.library.exercises.editModal.saving') : t('coach.warmupPlanner.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: 420,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as object,
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#16a34a',
  },
  saveBtnDisabled: {
    backgroundColor: '#86efac',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
