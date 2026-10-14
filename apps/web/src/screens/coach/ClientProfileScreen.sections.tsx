import React from 'react';
import { Text, View } from 'react-native';
import { EditClientProfileModal } from './components/EditClientProfileModal';
import { ClientProfileSummary } from './components/ClientProfileSummary';
import { toUpdateInput } from './client-profile.form';
import { validateClientProfileForm } from './client-profile.validation';
import { styles } from './ClientProfileScreen.styles';
import {
  archiveClient,
  assignRandomAvatar,
  clearFieldErrorAndSetValue,
  resetClientPassword,
  uploadAvatarFromPicker,
} from './ClientProfileScreen.actions';
import type { ViewModel } from './ClientProfileScreen';

export function SummarySection(props: { vm: ViewModel }): React.JSX.Element {
  return (
    <View style={styles.summaryCard}>
      <ClientProfileSummary
        client={props.vm.query.data!}
        onEdit={props.vm.onOpenEdit}
        t={props.vm.t}
        weightDraftKg={props.vm.form.weightKg}
      />
      {props.vm.saveSuccess ? <Text style={styles.success}>{props.vm.t('coach.clientProfile.saved')}</Text> : null}
    </View>
  );
}

export function ProfileEditModal(props: { vm: ViewModel }): React.JSX.Element {
  return (
    <EditClientProfileModal
      avatarUrl={props.vm.query.data?.avatarUrl ?? null}
      errors={props.vm.errors}
      form={props.vm.form}
      isArchiving={props.vm.archiveMutation.isPending}
      isResettingPassword={props.vm.resetPasswordMutation.isPending}
      isSaving={props.vm.isSaving}
      isUploading={props.vm.uploadAvatarMutation.isPending}
      onArchive={() => void archiveClient(props.vm)}
      onChange={(key, value) => clearFieldErrorAndSetValue(props.vm.setErrors, props.vm.setForm, key, value)}
      onClose={() => props.vm.setEditing(false)}
      onPickRandomAvatar={() => void assignRandomAvatar(props.vm)}
      onResetPassword={() => void resetClientPassword(props.vm)}
      onSave={() => void saveProfile(props.vm)}
      onUploadAvatar={() => void uploadAvatarFromPicker(props.vm)}
      objectiveOptions={props.vm.objectiveOptions}
      resetPassword={props.vm.resetPassword}
      saveError={props.vm.saveError}
      t={props.vm.t}
      visible={props.vm.editing}
    />
  );
}

async function saveProfile(vm: ViewModel): Promise<void> {
  const errors = validateClientProfileForm(vm.form, vm.t);
  if (Object.keys(errors).length > 0) {
    vm.setErrors(errors);
    return;
  }
  await vm.updateMutation.mutateAsync(toUpdateInput(vm.form));
  vm.setErrors({});
  vm.setEditing(false);
}
