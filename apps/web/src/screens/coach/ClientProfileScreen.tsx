import { LoadingState } from '../../components/AsyncStatus';
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
import { ClientProfileNoteModal } from './components/ClientProfileNoteModal';
import { ClientProfileSectionsBoard } from './components/ClientProfileSectionsBoard';
import { emptyForm, toForm, type ClientForm } from './client-profile.form';
import { type FormErrors } from './client-profile.validation';
import { styles } from './ClientProfileScreen.styles';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { LIST_KEYS, writeListContext, writeRouteClientId } from '../../layout/list-context';
import { useProgressContextStore } from '../../store/progressContext.store';
import { useNutritionContextStore } from '../../store/nutritionContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useDeferredDelete } from '../../layout/useDeferredDelete';
import { ProfileEditModal, SummarySection } from './ClientProfileScreen.sections';
import { RoutineAssignmentHistory } from './RoutineAssignmentHistory';

type Props = {
  clientId: string;
  onArchived?: () => void;
  onOpenCompareScreen?: (clientId: string) => void;
  onOpenMeasuresScreen?: (clientId: string) => void;
  onOpenPlanningScreen?: (clientId: string) => void;
  onOpenVolumeScreen?: (clientId: string) => void;
  onOpenEditScreen?: (clientId: string) => void;
  onOpenMoodScreen?: (clientId: string) => void;
  onOpenNutrition?: () => void;
  onOpenTestsScreen?: (clientId: string) => void;
  onRouteChange?: (route: ShellRoute) => void;
};

export function ClientProfileScreen(props: Props): React.JSX.Element {
  const vm = useClientProfileModel(
    props.clientId,
    props.onArchived,
    props.onRouteChange,
    props.onOpenEditScreen,
    props.onOpenCompareScreen,
    props.onOpenMeasuresScreen,
    props.onOpenPlanningScreen,
    props.onOpenVolumeScreen,
    props.onOpenNutrition,
    props.onOpenMoodScreen,
    props.onOpenTestsScreen,
  );
  return <ClientProfileView vm={vm} />;
}

function useClientProfileModel(
  clientId: string,
  onArchived?: () => void,
  onRouteChange?: (route: ShellRoute) => void,
  onOpenEditScreen?: (clientId: string) => void,
  onOpenCompareScreen?: (clientId: string) => void,
  onOpenMeasuresScreen?: (clientId: string) => void,
  onOpenPlanningScreen?: (clientId: string) => void,
  onOpenVolumeScreen?: (clientId: string) => void,
  onOpenNutrition?: () => void,
  onOpenMoodScreen?: (clientId: string) => void,
  onOpenTestsScreen?: (clientId: string) => void,
) {
  const { t } = useTranslation();
  const query = useClientByIdQuery(clientId);
  const objectivesQuery = useClientObjectivesQuery();
  const openForView = useRoutinePlannerContextStore((state) => state.openForView);
  const prepareClientAssignment = useRoutinePlannerContextStore((state) => state.prepareClientAssignment);
  const openProgressForClient = useProgressContextStore((state) => state.openForClient);
  const openNutritionForClient = useNutritionContextStore((state) => state.openForClient);
  const mutations = useProfileMutations(clientId);
  const deferred = useDeferredDelete();
  const state = useProfileState();
  useSyncFormFromQuery(query.data, state.setForm, state.setErrors, state.setNoteDraft);
  return buildViewModel({
    onArchived,
    onOpenEditScreen,
    onOpenCompareScreen,
    onOpenMeasuresScreen,
    onOpenPlanningScreen,
    onOpenVolumeScreen,
    onOpenNutrition,
    onOpenMoodScreen,
    onOpenTestsScreen,
    onRouteChange,
    query,
    objectives: objectivesQuery.data ?? [],
    openForView,
    openNutritionForClient,
    openProgressForClient,
    prepareClientAssignment,
    ...mutations,
    deferred,
    ...state,
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
  deferred: ReturnType<typeof useDeferredDelete>;
  editing: boolean;
  editingNote: boolean;
  errors: FormErrors;
  form: ClientForm;
  noteDraft: string;
  onArchived?: () => void;
  onOpenCompareScreen?: (clientId: string) => void;
  onOpenMeasuresScreen?: (clientId: string) => void;
  onOpenPlanningScreen?: (clientId: string) => void;
  onOpenVolumeScreen?: (clientId: string) => void;
  onOpenEditScreen?: (clientId: string) => void;
  onOpenMoodScreen?: (clientId: string) => void;
  onOpenNutrition?: () => void;
  onOpenTestsScreen?: (clientId: string) => void;
  onRouteChange?: (route: ShellRoute) => void;
  openForView: (templateId: string, clientId?: string, clientDisplayName?: string) => void;
  openNutritionForClient: (clientId: string, clientDisplayName: string) => void;
  openProgressForClient: (clientId: string, clientDisplayName: string) => void;
  prepareClientAssignment: (clientId: string, clientDisplayName: string) => void;
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
  const onOpenProgress = buildOpenProgressAction(input);
  const onOpenNutrition = buildOpenNutritionAction(input);
  const onOpenMood = buildOpenMoodAction(input);
  const onOpenTests = buildOpenTestsAction(input);
  const onOpenCompare = buildOpenCompareAction(input);
  const onOpenMeasures = buildOpenMeasuresAction(input);
  const onOpenPlanning = buildOpenPlanningAction(input);
  const onOpenVolume = buildOpenVolumeAction(input);
  const onOpenChat = buildOpenChatAction(input);
  const onOpenIncidents = buildOpenIncidentsAction(input);

  return {
    ...input,
    objectiveOptions,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.isError,
    saveSuccess: updateMutation.isSuccess,
    trainingPlan: client?.trainingPlan ?? undefined,
    onOpenEdit: () => (input.onOpenEditScreen && client ? input.onOpenEditScreen(client.id) : input.setEditing(true)),
    onOpenRoutinePlanner,
    onOpenNutrition,
    onOpenMood,
    onOpenProgress,
    onOpenTests,
    onOpenCompare,
    onOpenMeasures,
    onOpenPlanning,
    onOpenVolume,
    onOpenChat,
    onOpenIncidents,
    onUnassignPlan: () => void updateMutation.mutateAsync({ trainingPlanId: null }),
    ...noteActions,
  };
}

function buildNoteActions(input: ViewModelInput, updateMutation: ReturnType<typeof useUpdateClientMutation>) {
  return {
    onChangeNote: (value: string) => input.setNoteDraft(value),
    onCloseNote: () => input.setEditingNote(false),
    onDeleteNote: () => {
      const previous = input.noteDraft;
      const name = input.query.data?.firstName ?? '';
      input.deferred.schedule({
        formatError: () => input.t('coach.notes.error.delete'),
        id: `client-note-${input.query.data?.id ?? 'current'}`,
        label: input.t('coach.notes.toast.deletedUndo', { name }),
        onUndo: () => {
          input.setNoteDraft(previous);
          input.setEditingNote(true);
        },
        run: async () => {
          await updateMutation.mutateAsync({ notes: null });
          input.setNoteDraft('');
        },
      });
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

function buildOpenProgressAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client) return;
    const clientDisplayName = `${client.firstName} ${client.lastName}`.trim();
    input.openProgressForClient(client.id, clientDisplayName);
    writeRouteClientId(client.id);
    input.onRouteChange?.('coach.progress');
  };
}

function buildOpenNutritionAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client) return;
    const clientDisplayName = `${client.firstName} ${client.lastName}`.trim();
    input.openNutritionForClient(client.id, clientDisplayName);
    input.onOpenNutrition?.();
  };
}

function buildOpenMoodAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client || !input.onOpenMoodScreen) return;
    input.onOpenMoodScreen(client.id);
  };
}

function buildOpenChatAction(input: ViewModelInput): () => void {
  return () => openClientSection(input, LIST_KEYS.chat, 'coach.chat');
}

function buildOpenIncidentsAction(input: ViewModelInput): () => void {
  return () => openClientSection(input, LIST_KEYS.incidents, 'coach.incidents');
}

function openClientSection(input: ViewModelInput, key: string, route: ShellRoute): void {
  const client = input.query.data;
  if (!client) return;
  writeListContext(key, { clientId: client.id, fromProfile: true });
  input.onRouteChange?.(route);
}

function buildOpenCompareAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client || !input.onOpenCompareScreen) return;
    input.onOpenCompareScreen(client.id);
  };
}

function buildOpenMeasuresAction(input: ViewModelInput): () => void {
  return () => openClientScreen(input, input.onOpenMeasuresScreen);
}

function buildOpenPlanningAction(input: ViewModelInput): () => void {
  return () => openClientScreen(input, input.onOpenPlanningScreen);
}

function buildOpenVolumeAction(input: ViewModelInput): () => void {
  return () => openClientScreen(input, input.onOpenVolumeScreen);
}

function openClientScreen(input: ViewModelInput, open?: (clientId: string) => void): void {
  const client = input.query.data;
  if (!client || !open) return;
  open(client.id);
}

function buildOpenTestsAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client || !input.onOpenTestsScreen) return;
    input.onOpenTestsScreen(client.id);
  };
}

function buildOpenRoutinePlannerAction(input: ViewModelInput): () => void {
  return () => {
    const client = input.query.data;
    if (!client) return;
    if (client.trainingPlan?.id) {
      // Has a routine → open the planner in view-only mode (read-only, no save/assign)
      const clientDisplayName = `${client.firstName} ${client.lastName}`.trim();
      input.openForView(client.trainingPlan.id, client.id, clientDisplayName);
      writeRouteClientId(client.id);
      input.onRouteChange?.('coach.routine.planner');
    } else {
      // No routine → go to library to pick/assign one
      const clientDisplayName = `${client.firstName} ${client.lastName}`.trim();
      input.prepareClientAssignment(client.id, clientDisplayName);
      writeRouteClientId(client.id);
      input.onRouteChange?.('coach.library.routines');
    }
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

export type ViewModel = ReturnType<typeof useClientProfileModel>;

function ClientProfileView(props: { vm: ViewModel }): React.JSX.Element {
  if (props.vm.query.isLoading) {
    return <LoadingState label={props.vm.t('coach.clientProfile.loading')} />;
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
      <RoutineAssignmentHistory clientId={props.vm.query.data!.id} />
      <ClientProfileSectionsBoard
        clientId={props.vm.query.data!.id}
        clientName={`${props.vm.query.data!.firstName} ${props.vm.query.data!.lastName}`.trim()}
        hasTrainingPlan={Boolean(props.vm.trainingPlan)}
        onOpenChat={props.vm.onOpenChat}
        onOpenIncidents={props.vm.onOpenIncidents}
        onOpenMood={props.vm.onOpenMood}
        onOpenNutrition={props.vm.onOpenNutrition}
        onOpenProgress={props.vm.onOpenProgress}
        onOpenTests={props.vm.onOpenTests}
        onOpenCompare={props.vm.onOpenCompare}
        onOpenMeasures={props.vm.onOpenMeasures}
        onOpenPlanning={props.vm.onOpenPlanning}
        onOpenVolume={props.vm.onOpenVolume}
        onOpenTrainingPlanner={props.vm.onOpenRoutinePlanner}
        onUnassignTrainingPlan={props.vm.onUnassignPlan}
        t={props.vm.t}
        trainingPlanName={props.vm.trainingPlan?.name}
      />
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
