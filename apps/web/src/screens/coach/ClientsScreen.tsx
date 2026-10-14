import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Button, useBreakpoint } from '@trainerpro/ui';
import '../../i18n';
import { useCreateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientObjectivesQuery, useClientsQuery } from '../../data/hooks/useClientsQuery';
import { styles } from './clients-screen.styles';
import { ClientNutritionPlanScreen } from './ClientNutritionPlanScreen';
import { ClientProfileScreen } from './ClientProfileScreen';
import { ClientProfileEditScreen } from './ClientProfileEditScreen';
import { ClientTestsScreen } from './ClientTestsScreen';
import { ClientMoodScreen } from './ClientMoodScreen';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { ClientsDirectoryPanel } from './components/ClientsDirectoryPanel';
import { CreateClientModal } from './components/CreateClientModal';
import { CreateClientResultBanner } from './components/CreateClientResultBanner';
import { EmptyClientSelectionPanel } from './components/EmptyClientSelectionPanel';
import { useClientCreateForm } from './useClientCreateForm';
import { useLocation, useNavigate } from 'react-router';
import { LIST_KEYS } from '../../layout/list-context';
import { useListContext } from '../../layout/useListContext';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { buildClientCrumbs, type ClientCrumbMode } from '../../layout/crumbs';
import { SHELL_PATHS } from '../../layout/shell-routes';
import { clientsScreenPath, readClientsLocation, type ScreenMode } from './clients-location';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { useQuickCreateStore } from '../../store/quickCreate.store';
import { OnboardingCard } from '../../components/OnboardingGuide';

const MODE_NUTRITION = 'nutrition' as const;
const MODE_MOOD = 'mood' as const;
const MODE_TESTS = 'tests' as const;

type Props = {
  onRouteChange?: (route: ShellRoute) => void;
};
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
  const quickIntent = useQuickCreateStore((current) => current.intent);
  useEffect(() => {
    if (quickIntent !== 'client') return;
    useQuickCreateStore.getState().consume();
    refs.form.onOpenModal();
  }, [quickIntent, refs.form]);
  useEffect(() => {
    const clientIdFromPlanner = consumeClientId();
    if (clientIdFromPlanner) {
      state.open(clientIdFromPlanner, 'profile', true);
      return;
    }
  }, [consumeClientId]);
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
    onRetryClients: () => void refs.clientsQuery.refetch(),
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
    onBackToList: state.backToList,
    onBackToProfile: () => state.open(state.selectedClientId, 'profile'),
    onOpenNutrition: () => state.open(state.selectedClientId, 'nutrition'),
    onOpenMoodScreen: (clientId: string) => state.open(clientId, 'mood'),
    onOpenTestsScreen: (clientId: string) => state.open(clientId, 'tests'),
    // La pantalla ya vive en la dirección: al archivar basta con volver a la lista (onBackToList).
    onClearSelectedClient: () => undefined,
    onOpenProfileEdit: (clientId: string) => state.open(clientId, 'profileEdit'),
    onSelectClient: (clientId: string) => state.open(clientId, 'profile'),
    objectiveFilter: state.objectiveFilter,
    onObjectiveFilterChange: state.setObjectiveFilter,
    onSearchValueChange: state.setSearchValue,
    searchValue: state.searchValue,
  };
}

function useClientsDataRefs() {
  const clientsQuery = useClientsQuery();
  const objectivesQuery = useClientObjectivesQuery();
  const createMutation = useCreateClientMutation();
  const objectiveOptions = objectivesQuery.data ?? [];
  const form = useClientCreateForm(createMutation, objectiveOptions);
  return { clientsQuery, form, objectiveOptions };
}

type ClientsListContext = {
  objectiveFilter: string;
  searchValue: string;
};

/** Filtros guardados en la sesión; la pantalla y el cliente salen de la dirección del navegador. */
function useClientsViewState() {
  const [context, setContext] = useListContext(LIST_KEYS.clients, emptyClientsContext());
  const location = useLocation();
  const navigate = useNavigate();
  const { screenMode, selectedClientId } = readClientsLocation(location.pathname);
  return {
    backToList: () => navigate(SHELL_PATHS['coach.clients']),
    objectiveFilter: context.objectiveFilter,
    open: (clientId: string, mode: ScreenMode, replace = false) => navigate(clientsScreenPath(clientId, mode), { replace }),
    screenMode,
    searchValue: context.searchValue,
    selectedClientId,
    setObjectiveFilter: (objectiveFilter: string) => setContext((prev) => ({ ...prev, objectiveFilter })),
    setSearchValue: (searchValue: string) => setContext((prev) => ({ ...prev, searchValue })),
  };
}

function emptyClientsContext(): ClientsListContext {
  return { objectiveFilter: 'ALL', searchValue: '' };
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
  const compact = useBreakpoint() !== 'lg';
  return (
    <ScrollView contentContainerStyle={compact ? [styles.page, styles.pageCompact] : styles.page}>
      <View style={styles.container}>
        {renderMainContent(props)}
        <CreateClientDialog props={props} />
      </View>
    </ScrollView>
  );
}

function renderMainContent(props: ViewProps): React.JSX.Element {
  if (props.screenMode === 'nutrition' && props.selectedClientId) {
    return renderNutritionPage(props);
  }
  if (props.screenMode === 'mood' && props.selectedClientId) {
    return renderMoodPage(props);
  }
  if (props.screenMode === 'tests' && props.selectedClientId) {
    return renderTestsPage(props);
  }
  if ((props.screenMode === 'profile' || props.screenMode === 'profileEdit') && props.selectedClientId) {
    return renderProfilePage(props);
  }
  return (
    <>
      <Header count={props.clients.length} t={props.t} />
      <OnboardingCard />
      <View style={styles.formCard}>{renderCta(props)}</View>
      {renderCreateResult(props)}
      <View style={styles.listCard}>
        <ClientsDirectoryPanel
          clients={props.clients}
          clientsError={props.clientsError}
          clientsLoading={props.clientsLoading}
          objectiveFilter={props.objectiveFilter}
          onObjectiveFilterChange={props.onObjectiveFilterChange}
          onCreateClient={props.onOpenModal}
          onRetry={props.onRetryClients}
          onSearchValueChange={props.onSearchValueChange}
          onSelectClient={props.onSelectClient}
          searchValue={props.searchValue}
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
  return <CtaCard {...props} />;
}

function CtaCard(props: ViewProps): React.JSX.Element {
  const stacked = useBreakpoint() === 'sm';
  return (
    <View style={[styles.ctaCard, stacked && styles.ctaCardStacked]}>
      <View style={[styles.ctaText, stacked && styles.ctaTextStacked]}>
        <Text style={styles.ctaTitle}>{props.t('coach.clients.cta.title')}</Text>
        <Text style={styles.ctaSubtitle}>{props.t('coach.clients.cta.subtitle')}</Text>
      </View>
      <Button label={props.t('coach.clients.form.submit')} onPress={props.onOpenModal} />
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
      onOpenMoodScreen={props.onOpenMoodScreen}
      onOpenNutrition={props.onOpenNutrition}
      onOpenTestsScreen={props.onOpenTestsScreen}
      onRouteChange={props.onRouteChange}
    />
  );
}

function renderNutritionPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_NUTRITION} onBack={props.onBackToProfile} view={props} />
      <View style={styles.profileCard}>
        <ClientNutritionPlanScreen
          clientId={props.selectedClientId}
          clientName={props.selectedClientName}
          onBack={props.onBackToProfile}
        />
      </View>
    </>
  );
}

function renderMoodPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_MOOD} onBack={props.onBackToProfile} view={props} />
      <View style={styles.profileCard}>
        <ClientMoodScreen
          clientId={props.selectedClientId}
          clientName={props.selectedClientName}
          onBack={props.onBackToProfile}
        />
      </View>
    </>
  );
}

function renderTestsPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_TESTS} onBack={props.onBackToProfile} view={props} />
      <View style={styles.profileCard}>
        <ClientTestsScreen
          clientId={props.selectedClientId}
          clientName={props.selectedClientName}
          onBack={props.onBackToProfile}
        />
      </View>
    </>
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
  const editing = props.screenMode === 'profileEdit';
  return (
    <>
      <CrumbBar
        mode={editing ? 'edit' : 'profile'}
        onBack={editing ? props.onBackToProfile : props.onBackToList}
        view={props}
      />
      <View style={styles.profileCard}>{editing ? renderProfileEdit(props) : renderProfile(props)}</View>
    </>
  );
}

/** Botón "Volver" y migas de pan (Clientes › Nombre › Pantalla) con enlaces a cada nivel. */
function CrumbBar(props: { mode: ClientCrumbMode; onBack: () => void; view: ViewProps }): React.JSX.Element {
  const { t } = props.view;
  const crumbs = buildClientCrumbs({
    clientId: props.view.selectedClientId,
    clientName: props.view.selectedClientName,
    mode: props.mode,
    t,
  });
  return (
    <View style={styles.breadcrumbCard}>
      <Button label={t('common.back')} onPress={props.onBack} size="sm" variant="secondary" />
      <Breadcrumbs accessibilityLabel={t('app.breadcrumb')} crumbs={crumbs} />
    </View>
  );
}
