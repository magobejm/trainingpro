import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIM = 'fade' as const;
const PLACEHOLDER_COLOR = colors.textMuted;

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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.xl,
    width: 420,
    gap: space.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: fontSize.sm,
    color: colors.text,
    outlineStyle: 'none',
  } as object,
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.md,
    marginTop: space.xs,
  },
  cancelBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.success,
  },
  saveBtnDisabled: {
    backgroundColor: colors.successSoft,
  },
  saveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.surface,
  },
});
