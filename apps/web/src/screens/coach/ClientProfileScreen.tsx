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
import { useClientByIdQuery, useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import { ClientProfileDetailsList } from './components/ClientProfileDetailsList';
import { ClientProfileKpiCards } from './components/ClientProfileKpiCards';
import { EditClientProfileModal } from './components/EditClientProfileModal';
import { ClientProfileTrainingPlan } from './components/ClientProfileTrainingPlan';
import { ClientProfileNoteModal } from './components/ClientProfileNoteModal';
import { ClientProfileSummary } from './components/ClientProfileSummary';
import { emptyForm, toForm, toUpdateInput, type ClientForm } from './client-profile.form';
import { type FormErrors, validateClientProfileForm } from './client-profile.validation';
import { styles } from './ClientProfileScreen.styles';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import {
  archiveClient,
  assignRandomAvatar,
  clearFieldErrorAndSetValue,
  resetClientPassword,
  uploadAvatarFromPicker,
} from './ClientProfileScreen.actions';

type Props = {
  clientId: string;
  onArchived?: () => void;
  onRouteChange?: (route: ShellRoute) => void;
};

export function ClientProfileScreen(props: Props): React.JSX.Element {
  const vm = useClientProfileModel(props.clientId, props.onArchived, props.onRouteChange);
  return <ClientProfileView vm={vm} />;
}

function useClientProfileModel(
  clientId: string,
  onArchived?: () => void,
  onRouteChange?: (route: ShellRoute) => void,
) {
  const { t } = useTranslation();
  const query = useClientByIdQuery(clientId);
  const objectivesQuery = useClientObjectivesQuery();
  const openForClient = useRoutinePlannerContextStore((state) => state.openForClient);
  const mutations = useProfileMutations(clientId);
  const state = useProfileState();
  useSyncFormFromQuery(query.data, state.setForm, state.setErrors, state.setNoteDraft);
  return buildViewModel({
    ...mutations,
    ...state,
    onArchived,
    onRouteChange,
    query,
    objectives: objectivesQuery.data ?? [],
    openForClient,
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
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [resetPassword, setResetPassword] = useState<null | string>(null);

  return {
    editing,
    editingNote,
    errors,
    form,
    noteDraft,
    resetPassword,
    setEditing,
    setEditingNote,
    setErrors,
    setForm,
    setNoteDraft,
    setResetPassword,
  };
}

function useSyncFormFromQuery(
  queryData: ReturnType<typeof useClientByIdQuery>['data'],
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
  setNoteDraft: React.Dispatch<React.SetStateAction<string>>,
): void {
  useEffect(() => {
    if (!queryData) {
      return;
    }
    setForm(toForm(queryData));
    setNoteDraft(queryData.notes ?? '');
    setErrors({});
  }, [queryData, setErrors, setForm, setNoteDraft]);
}

interface ViewModelInput {
  archiveMutation: ReturnType<typeof useArchiveClientMutation>;
  editing: boolean;
  editingNote: boolean;
  errors: FormErrors;
  form: ClientForm;
  noteDraft: string;
  onArchived?: () => void;
  onRouteChange?: (route: ShellRoute) => void;
  openForClient: (
    clientId: string,
    clientDisplayName: string,
    initialTemplateId?: null | string,
  ) => void;
  query: ReturnType<typeof useClientByIdQuery>;
  objectives: Array<{ id: string; label: string }>;
  resetPassword: null | string;
  resetPasswordMutation: ReturnType<typeof useResetClientPasswordMutation>;
  setEditingNote: React.Dispatch<React.SetStateAction<boolean>>;
  setNoteDraft: React.Dispatch<React.SetStateAction<string>>;
  setResetPassword: React.Dispatch<React.SetStateAction<null | string>>;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>;
  t: ReturnType<typeof useTranslation>['t'];
  updateMutation: ReturnType<typeof useUpdateClientMutation>;
  uploadAvatarMutation: ReturnType<typeof useUploadClientAvatarMutation>;
}

function buildViewModel(input: ViewModelInput) {
  const client = input.query.data;
  const objectiveOptions = readObjectiveOptions(input.query.data, input.objectives);
  const { updateMutation } = input;
  const noteActions = buildNoteActions(input, updateMutation);
  const onOpenRoutinePlanner = buildOpenRoutinePlannerAction(input);

  return {
    ...input,
    objectiveOptions,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.isError,
    saveSuccess: updateMutation.isSuccess,
    trainingPlan: client?.trainingPlan ?? undefined,
    onOpenEdit: () => input.setEditing(true),
    onOpenRoutinePlanner,
    onUnassignPlan: () => void updateMutation.mutateAsync({ trainingPlanId: null }),
    ...noteActions,
  };
}

function buildNoteActions(
  input: ViewModelInput,
  updateMutation: ReturnType<typeof useUpdateClientMutation>,
) {
  return {
    onChangeNote: (value: string) => input.setNoteDraft(value),
    onCloseNote: () => input.setEditingNote(false),
    onDeleteNote: async () => {
      await updateMutation.mutateAsync({ notes: null });
      input.setNoteDraft('');
      input.setEditingNote(false);
    },
    onOpenNote: () => input.setEditingNote(true),
    onSaveNote: async () => {
      await updateMutation.mutateAsync({ notes: input.noteDraft.trim() || null });
      input.setEditingNote(false);
    },
  };
}

function buildOpenRoutinePlannerAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client) {
      return;
    }
    const clientDisplayName = `${client.firstName} ${client.lastName}`.trim();
    input.openForClient(client.id, clientDisplayName, client.trainingPlan?.id ?? null);
    input.onRouteChange?.('coach.routine.planner');
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
      <ClientProfileTrainingPlan
        t={props.vm.t}
        trainingPlan={props.vm.trainingPlan}
        onOpenPlanner={props.vm.onOpenRoutinePlanner}
        onUnassign={props.vm.onUnassignPlan}
      />
      <ClientProfileDetailsList t={props.vm.t} />
      <ClientProfileKpiCards t={props.vm.t} />
      <ProfileEditModal vm={props.vm} />
      <ClientProfileNoteModal
        draft={props.vm.noteDraft}
        isSaving={props.vm.isSaving}
        onChange={props.vm.onChangeNote}
        onClose={props.vm.onCloseNote}
        onDelete={props.vm.onDeleteNote}
        onSave={props.vm.onSaveNote}
        t={props.vm.t}
        visible={props.vm.editingNote}
      />
    </View>
  );
}

function SummarySection(props: { vm: ViewModel }): React.JSX.Element {
  return (
    <View style={styles.summaryCard}>
      <ClientProfileSummary
        client={props.vm.query.data!}
        onEdit={() => props.vm.setEditing(true)}
        onEditNote={props.vm.onOpenNote}
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
      onChange={(key, value) =>
        clearFieldErrorAndSetValue(props.vm.setErrors, props.vm.setForm, key, value)
      }
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
