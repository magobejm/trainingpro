import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import '../../i18n';
import { useCreateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientObjectivesQuery, useClientsQuery } from '../../data/hooks/useClientsQuery';
import { styles } from './clients-screen.styles';
import { ClientProfileScreen } from './ClientProfileScreen';
import { ClientProfileEditScreen } from './ClientProfileEditScreen';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { ClientsDirectoryPanel } from './components/ClientsDirectoryPanel';
import { CreateClientModal } from './components/CreateClientModal';
import { CreateClientResultBanner } from './components/CreateClientResultBanner';
import { EmptyClientSelectionPanel } from './components/EmptyClientSelectionPanel';
import { useClientCreateForm } from './useClientCreateForm';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { useProgressContextStore } from '../../store/progressContext.store';

type Props = {
  onRouteChange?: (route: ShellRoute) => void;
};
type ScreenMode = 'list' | 'profile' | 'profileEdit';
type SelectedClient = {
  avatarUrl: null | string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  objective: null | string;
};

export function ClientsScreen(props: Props): React.JSX.Element {
  const vm = useClientsViewModel(props.onRouteChange);
  return <ClientsView {...vm} />;
}

function useClientsViewModel(onRouteChange?: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const refs = useClientsDataRefs();
  const state = useClientsViewState();
  const consumeClientId = useRoutinePlannerContextStore((state) => state.consumeClientId);
  const consumeReturnClientId = useProgressContextStore((state) => state.consumeReturnClientId);
  useEffect(() => {
    const clientIdFromPlanner = consumeClientId();
    if (clientIdFromPlanner) {
      state.setSelectedClientId(clientIdFromPlanner);
      state.setScreenMode('profile');
      return;
    }
    const clientIdFromProgress = consumeReturnClientId();
    if (clientIdFromProgress) {
      state.setSelectedClientId(clientIdFromProgress);
      state.setScreenMode('profile');
    }
  }, [consumeClientId, consumeReturnClientId]);
  const selectedClientName = resolveSelectedClientName(refs.clientsQuery.data ?? [], state.selectedClientId);
  const selectedClient = resolveSelectedClient(refs.clientsQuery.data ?? [], state.selectedClientId);
  return buildClientsViewModel(refs, selectedClientName, selectedClient, state, onRouteChange, t);
}

function buildClientsViewModel(
  refs: ReturnType<typeof useClientsDataRefs>,
  selectedClientName: string,
  selectedClient: null | SelectedClient,
  state: ReturnType<typeof useClientsViewState>,
  onRouteChange: Props['onRouteChange'],
  t: ReturnType<typeof useTranslation>['t'],
) {
  const actions = readViewModelActions(state);
  return {
    ...refs.form,
    clients: refs.clientsQuery.data ?? [],
    clientsError: refs.clientsQuery.error,
    clientsLoading: refs.clientsQuery.isLoading,
    objectiveOptions: refs.objectiveOptions,
    ...actions,
    onRouteChange,
    screenMode: state.screenMode,
    selectedClient,
    selectedClientId: state.selectedClientId,
    selectedClientName,
    t,
  };
}

function readViewModelActions(state: ReturnType<typeof useClientsViewState>) {
  return {
    onBackToList: () => backToList(state),
    onBackToProfile: () => state.setScreenMode('profile'),
    onClearSelectedClient: () => state.setSelectedClientId(''),
    onOpenProfileEdit: (clientId: string) => {
      state.setSelectedClientId(clientId);
      state.setScreenMode('profileEdit');
    },
    onSelectClient: (clientId: string) => selectClient(state, clientId),
  };
}

function selectClient(state: ReturnType<typeof useClientsViewState>, clientId: string): void {
  state.setSelectedClientId(clientId);
  state.setScreenMode('profile');
}

function backToList(state: ReturnType<typeof useClientsViewState>): void {
  state.setSelectedClientId('');
  state.setScreenMode('list');
}

function useClientsDataRefs() {
  const clientsQuery = useClientsQuery();
  const objectivesQuery = useClientObjectivesQuery();
  const createMutation = useCreateClientMutation();
  const objectiveOptions = objectivesQuery.data ?? [];
  const form = useClientCreateForm(createMutation, objectiveOptions);
  return { clientsQuery, form, objectiveOptions };
}

function useClientsViewState() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  return { screenMode, selectedClientId, setScreenMode, setSelectedClientId };
}

function resolveSelectedClientName(
  clients: Array<{ firstName: string; id: string; lastName: string }>,
  selectedClientId: string,
): string {
  const selected = clients.find((item) => item.id === selectedClientId);
  if (!selected) {
    return '';
  }
  return `${selected.firstName} ${selected.lastName}`.trim();
}

function resolveSelectedClient(clients: SelectedClient[], selectedClientId: string) {
  return clients.find((item) => item.id === selectedClientId) ?? null;
}

type ViewProps = ReturnType<typeof useClientsViewModel>;

function ClientsView(props: ViewProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        {renderMainContent(props)}
        <CreateClientDialog props={props} />
      </View>
    </ScrollView>
  );
}

function renderMainContent(props: ViewProps): React.JSX.Element {
  if ((props.screenMode === 'profile' || props.screenMode === 'profileEdit') && props.selectedClientId) {
    return renderProfilePage(props);
  }
  return (
    <>
      <Header count={props.clients.length} t={props.t} />
      <View style={styles.formCard}>{renderCta(props)}</View>
      {renderCreateResult(props)}
      <View style={styles.listCard}>
        <ClientsDirectoryPanel
          clients={props.clients}
          clientsError={props.clientsError}
          clientsLoading={props.clientsLoading}
          onSelectClient={props.onSelectClient}
          selectedClientId={props.selectedClientId}
          t={props.t}
        />
      </View>
      <View style={styles.profileCard}>
        <EmptyClientSelectionPanel t={props.t} />
      </View>
    </>
  );
}

function CreateClientDialog({ props }: { props: ViewProps }): React.JSX.Element {
  return (
    <CreateClientModal
      availableAvatars={props.availableAvatars}
      avatarUrl={props.avatarUrl}
      confirmEmail={props.confirmEmail}
      email={props.email}
      emailMismatch={props.emailMismatch}
      firstName={props.firstName}
      isFormValid={props.isFormValid}
      isSubmitting={props.isCreating}
      lastName={props.lastName}
      onClose={props.onCloseModal}
      onConfirmEmailChange={props.setConfirmEmail}
      onCreate={props.onCreate}
      onEmailChange={props.setEmail}
      onFirstNameChange={props.setFirstName}
      onLastNameChange={props.setLastName}
      t={props.t}
      visible={props.modalVisible}
      objectiveId={props.objectiveId}
      objectiveOptions={props.objectiveOptions}
      onObjectiveChange={props.setObjectiveId}
      onSelectAvatar={props.setAvatarUrl}
    />
  );
}

function renderCreateResult(props: ViewProps): React.JSX.Element | null {
  if (!props.result) {
    return null;
  }
  return (
    <CreateClientResultBanner
      isResettingPassword={props.isResettingPassword}
      onClose={props.onClearResult}
      onResetPassword={props.onResetPassword}
      result={props.result}
      t={props.t}
    />
  );
}

function Header(props: { count: number; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>{props.t('coach.clients.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.clients.subtitle')}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{`${props.t('coach.clients.total')}: ${props.count}`}</Text>
      </View>
    </View>
  );
}

function renderCta(props: ViewProps): React.JSX.Element {
  return (
    <View style={styles.ctaCard}>
      <View style={styles.ctaText}>
        <Text style={styles.ctaTitle}>{props.t('coach.clients.cta.title')}</Text>
        <Text style={styles.ctaSubtitle}>{props.t('coach.clients.cta.subtitle')}</Text>
      </View>
      <Pressable onPress={props.onOpenModal} style={styles.createButton}>
        <Text style={styles.createLabel}>{props.t('coach.clients.form.submit')}</Text>
      </Pressable>
    </View>
  );
}

function renderProfile(props: ViewProps): React.JSX.Element {
  return (
    <ClientProfileScreen
      clientId={props.selectedClientId}
      onArchived={() => {
        props.onClearSelectedClient();
        props.onBackToList();
      }}
      onOpenEditScreen={props.onOpenProfileEdit}
      onRouteChange={props.onRouteChange}
    />
  );
}

function renderProfileEdit(props: ViewProps): React.JSX.Element {
  return (
    <ClientProfileEditScreen
      clientId={props.selectedClientId}
      onArchived={() => {
        props.onClearSelectedClient();
        props.onBackToList();
      }}
      onBack={props.onBackToProfile}
    />
  );
}

function renderProfilePage(props: ViewProps): React.JSX.Element {
  const currentLabel = props.selectedClientName || props.t('coach.clients.title');
  const lastCrumb =
    props.screenMode === 'profileEdit' ? props.t('coach.clientProfile.edit.title') : props.t('coach.clientProfile.title');
  return (
    <>
      <View style={styles.breadcrumbCard}>
        <Pressable
          onPress={props.screenMode === 'profileEdit' ? props.onBackToProfile : props.onBackToList}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>{props.t('common.back')}</Text>
        </Pressable>
        <Text style={styles.breadcrumb}>{formatBreadcrumb([props.t('coach.clients.title'), currentLabel, lastCrumb])}</Text>
      </View>
      <View style={styles.profileCard}>
        {props.screenMode === 'profileEdit' ? renderProfileEdit(props) : renderProfile(props)}
      </View>
    </>
  );
}

function formatBreadcrumb(parts: string[]): string {
  return parts.filter((item) => item.trim().length > 0).join(' / ');
}
