import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import '../../i18n';
import {
  useArchiveClientMutation,
  useResetClientPasswordMutation,
  useUpdateClientMutation,
  useUploadClientAvatarMutation,
} from '../../data/hooks/useClientMutations';
import { resolveRandomAvatarUrl } from '../../data/avatar-default';
import { useClientByIdQuery, useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import { ClientProfileDetailsList } from './components/ClientProfileDetailsList';
import { ClientProfileKpiCards } from './components/ClientProfileKpiCards';
import { EditClientProfileModal } from './components/EditClientProfileModal';
import { ClientProfileSummary } from './components/ClientProfileSummary';
import { pickImageFile } from './client-profile.avatar';
import { emptyForm, toForm, toUpdateInput, type ClientForm } from './client-profile.form';
import { type FormErrors, validateClientProfileForm } from './client-profile.validation';
import { styles } from './ClientProfileScreen.styles';

type Props = {
  clientId: string;
  onArchived?: () => void;
};

export function ClientProfileScreen(props: Props): React.JSX.Element {
  const vm = useClientProfileModel(props.clientId, props.onArchived);
  return <ClientProfileView vm={vm} />;
}

function useClientProfileModel(clientId: string, onArchived?: () => void) {
  const { t } = useTranslation();
  const query = useClientByIdQuery(clientId);
  const objectivesQuery = useClientObjectivesQuery();
  const mutations = useProfileMutations(clientId);
  const state = useProfileState();
  useSyncFormFromQuery(query.data, state.setForm, state.setErrors);
  return buildViewModel({
    ...mutations,
    ...state,
    onArchived,
    query,
    objectives: objectivesQuery.data ?? [],
    t,
  });
}

function useProfileMutations(clientId: string) {
  return {
    archiveMutation: useArchiveClientMutation(),
    resetPasswordMutation: useResetClientPasswordMutation(),
    updateMutation: useUpdateClientMutation(clientId),
    uploadAvatarMutation: useUploadClientAvatarMutation(clientId),
  };
}

function useProfileState() {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState(false);
  const [resetPassword, setResetPassword] = useState<null | string>(null);
  return {
    editing,
    errors,
    form,
    resetPassword,
    setEditing,
    setErrors,
    setForm,
    setResetPassword,
  };
}

function useSyncFormFromQuery(
  queryData: ReturnType<typeof useClientByIdQuery>['data'],
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
): void {
  useEffect(() => {
    if (!queryData) {
      return;
    }
    setForm(toForm(queryData));
    setErrors({});
  }, [queryData, setErrors, setForm]);
}

function buildViewModel(input: {
  archiveMutation: ReturnType<typeof useArchiveClientMutation>;
  editing: boolean;
  errors: FormErrors;
  form: ClientForm;
  onArchived?: () => void;
  query: ReturnType<typeof useClientByIdQuery>;
  objectives: Array<{ id: string; label: string }>;
  resetPassword: null | string;
  resetPasswordMutation: ReturnType<typeof useResetClientPasswordMutation>;
  setResetPassword: React.Dispatch<React.SetStateAction<null | string>>;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>;
  t: ReturnType<typeof useTranslation>['t'];
  updateMutation: ReturnType<typeof useUpdateClientMutation>;
  uploadAvatarMutation: ReturnType<typeof useUploadClientAvatarMutation>;
}) {
  const objectiveOptions = readObjectiveOptions(input.query.data, input.objectives);
  return {
    ...input,
    objectiveOptions,
    isSaving: input.updateMutation.isPending,
    saveError: input.updateMutation.isError,
    saveSuccess: input.updateMutation.isSuccess,
  };
}

function readObjectiveOptions(
  client: ReturnType<typeof useClientByIdQuery>['data'],
  list: Array<{ id: string; label: string }>,
) {
  if (client?.objectiveOptions && client.objectiveOptions.length > 0) {
    return client.objectiveOptions;
  }
  return list;
}

type ViewModel = ReturnType<typeof useClientProfileModel>;

function ClientProfileView(props: { vm: ViewModel }): React.JSX.Element {
  if (props.vm.query.isLoading) {
    return <Message text={props.vm.t('coach.clientProfile.loading')} />;
  }
  if (props.vm.query.isError || !props.vm.query.data) {
    return <Message text={props.vm.t('coach.clientProfile.error')} />;
  }
  return <LoadedClientView vm={props.vm} />;
}

function Message(props: { text: string }): React.JSX.Element {
  return <Text style={styles.empty}>{props.text}</Text>;
}

function LoadedClientView(props: { vm: ViewModel }): React.JSX.Element {
  return (
    <View style={styles.page}>
      <SummarySection vm={props.vm} />
      <ClientProfileDetailsList t={props.vm.t} />
      <ClientProfileKpiCards t={props.vm.t} />
      <ProfileEditModal vm={props.vm} />
    </View>
  );
}

function SummarySection(props: { vm: ViewModel }): React.JSX.Element {
  return (
    <View style={styles.summaryCard}>
      <ClientProfileSummary
        client={props.vm.query.data!}
        onEdit={() => props.vm.setEditing(true)}
        t={props.vm.t}
        weightDraftKg={props.vm.form.weightKg}
      />
      {props.vm.saveSuccess ? (
        <Text style={styles.success}>{props.vm.t('coach.clientProfile.saved')}</Text>
      ) : null}
    </View>
  );
}

function ProfileEditModal(props: { vm: ViewModel }): React.JSX.Element {
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
      onChange={(key, value) => setField(props.vm.setErrors, props.vm.setForm, key, value)}
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

function setField(
  setErrors: ViewModel['setErrors'],
  setForm: ViewModel['setForm'],
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

async function uploadAvatarFromPicker(vm: ViewModel): Promise<void> {
  const file = await pickImageFile();
  if (!file) {
    return;
  }
  await vm.uploadAvatarMutation.mutateAsync(file);
}

async function assignRandomAvatar(vm: ViewModel): Promise<void> {
  await vm.updateMutation.mutateAsync({ avatarUrl: resolveRandomAvatarUrl() });
}

async function archiveClient(vm: ViewModel): Promise<void> {
  await vm.archiveMutation.mutateAsync(vm.query.data!.id);
  vm.setEditing(false);
  vm.onArchived?.();
}

async function resetClientPassword(vm: ViewModel): Promise<void> {
  const response = await vm.resetPasswordMutation.mutateAsync(vm.query.data!.id);
  vm.setResetPassword(response.temporaryPassword);
}
