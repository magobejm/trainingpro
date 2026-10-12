import React, { useEffect, useState } from 'react';
import { Button, Modal, TextField } from '@trainerpro/ui';

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
  const [touched, setTouched] = useState(false);
  const empty = !name.trim();

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setTouched(false);
    }
  }, [visible, initialName]);

  const submit = () => {
    setTouched(true);
    if (!empty) onSave(name.trim());
  };

  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <>
          <Button label={t('common.cancel')} onPress={onClose} variant="secondary" />
          <Button
            label={isSaving ? t('coach.library.exercises.editModal.saving') : t('coach.warmupPlanner.save')}
            loading={isSaving}
            onPress={submit}
          />
        </>
      }
      onClose={onClose}
      size="sm"
      title={t('coach.warmupPlanner.saveModal.title')}
      visible={visible}
    >
      <TextField
        error={touched && empty ? t('coach.clientProfile.validation.required') : null}
        label={t('coach.warmupPlanner.name')}
        onBlur={() => setTouched(true)}
        onChangeText={setName}
        placeholder={t('coach.warmupPlanner.namePlaceholder')}
        required
        value={name}
      />
    </Modal>
  );
}
