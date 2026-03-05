import React from 'react';
import type { UpdateClientInput } from '../../data/hooks/useClientMutations';
import type { ClientForm } from './client-profile.form';
import { pickImageFile } from './client-profile.avatar';
import { resolveRandomAvatarUrl } from '../../data/avatar-default';

type ViewModel = {
  archiveMutation: { mutateAsync: (id: string) => Promise<void> };
  onArchived?: () => void;
  query: { data?: { id: string } };
  resetPasswordMutation: { mutateAsync: (id: string) => Promise<{ temporaryPassword: string }> };
  setEditing: (value: boolean) => void;
  setResetPassword: React.Dispatch<React.SetStateAction<null | string>>;
  updateMutation: { mutateAsync: (input: UpdateClientInput) => Promise<void> };
  uploadAvatarMutation: { mutateAsync: (file: File) => Promise<unknown> };
};

export function clearFieldErrorAndSetValue(
  setErrors: (updater: (previous: Record<string, string>) => Record<string, string>) => void,
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>,
  key: keyof ClientForm,
  value: string,
): void {
  setErrors((previous) => {
    if (!previous[key]) {
      return previous;
    }
    const next = { ...previous };
    delete next[key];
    return next;
  });
  setForm((prev) => ({ ...prev, [key]: value }));
}

export async function uploadAvatarFromPicker(vm: ViewModel): Promise<void> {
  const file = await pickImageFile();
  if (!file) {
    return;
  }
  await vm.uploadAvatarMutation.mutateAsync(file);
}

export async function assignRandomAvatar(vm: ViewModel): Promise<void> {
  await vm.updateMutation.mutateAsync({ avatarUrl: resolveRandomAvatarUrl() });
}

export async function archiveClient(vm: ViewModel): Promise<void> {
  await vm.archiveMutation.mutateAsync(vm.query.data!.id);
  vm.setEditing(false);
  vm.onArchived?.();
}

export async function resetClientPassword(vm: ViewModel): Promise<void> {
  const response = await vm.resetPasswordMutation.mutateAsync(vm.query.data!.id);
  vm.setResetPassword(response.temporaryPassword);
}
