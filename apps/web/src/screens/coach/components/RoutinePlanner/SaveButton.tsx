import React from 'react';
import { Button } from '@trainerpro/ui';

interface SaveButtonProps {
  clientContextName?: null | string;
  isEditing: boolean;
  onSave: () => void;
  t: (k: string, options?: Record<string, unknown>) => string;
}

export function SaveButton({ clientContextName, isEditing, onSave, t }: SaveButtonProps) {
  const label = resolveSaveLabel(clientContextName, isEditing, t);
  return <Button label={label} onPress={onSave} />;
}

function resolveSaveLabel(
  clientContextName: null | string | undefined,
  isEditing: boolean,
  t: (k: string, options?: Record<string, unknown>) => string,
): string {
  if (clientContextName?.trim()) {
    return t('coach.routine.saveForClient', { client: clientContextName.trim() });
  }
  return isEditing ? t('coach.clientProfile.save') : t('coach.routine.save');
}
