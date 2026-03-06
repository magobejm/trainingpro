import { validateClientProfileForm } from './client-profile.validation';
import { toUpdateInput, type ClientForm } from './client-profile.form';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';

export type SaveViewModel = ReturnType<typeof useClientProfileEditState>;

export async function saveForm(
  vm: SaveViewModel,
  onSaved: () => void,
  t: (key: string) => string,
): Promise<void> {
  const validationErrors = validateClientProfileForm(vm.state.form, t);
  if (Object.keys(validationErrors).length > 0) {
    vm.state.setErrors(validationErrors);
    return;
  }
  const nextForm = await uploadPendingAvatar(vm);
  await vm.actions.saveClient(toUpdateInput(nextForm));
  vm.state.setErrors({});
  onSaved();
}

async function uploadPendingAvatar(vm: SaveViewModel): Promise<ClientForm> {
  if (!vm.state.pendingAvatarFile) return vm.state.form;
  const result = await vm.actions.uploadAvatar(vm.state.pendingAvatarFile);
  if (vm.state.pendingAvatarPreviewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(vm.state.pendingAvatarPreviewUrl);
  }
  vm.state.setPendingAvatarFile(null);
  vm.state.setPendingAvatarPreviewUrl('');
  const next = { ...vm.state.form, avatarUrl: (result as { avatarUrl: string }).avatarUrl };
  vm.state.setForm(next);
  return next;
}
