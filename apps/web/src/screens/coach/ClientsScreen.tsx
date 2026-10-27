import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Button, useBreakpoint } from '@trainerpro/ui';
import '../../i18n';
import { useCreateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientByIdQuery, useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import { useClientsPagedQuery } from '../../data/hooks/usePagedResources';
import { loadNextPage } from '../../data/hooks/usePagedList';
import type { ClientSort } from './clients-sort';
import { styles } from './clients-screen.styles';
import { ClientNutritionPlanScreen } from './ClientNutritionPlanScreen';
import { ClientProfileScreen } from './ClientProfileScreen';
import { ClientProfileEditScreen } from './ClientProfileEditScreen';
import { ClientCompareScreen } from './ClientCompareScreen';
import { ClientMeasuresScreen } from './ClientMeasuresScreen';
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
import { SHELL_PATHS } from '../../layout/shell-routes';
import { clientsScreenPath, readClientsLocation, type ScreenMode } from './clients-location';
import { CrumbBar } from './ClientsScreen.crumbs';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { useQuickCreateStore } from '../../store/quickCreate.store';
import { OnboardingCard } from '../../components/OnboardingGuide';
import { ArchivedClientsDrawer } from './components/ArchivedClientsDrawer';

const MODE_NUTRITION = 'nutrition' as const;
const MODE_MOOD = 'mood' as const;
const MODE_TESTS = 'tests' as const;
const MODE_COMPARE = 'compare' as const;
const MODE_MEASURES = 'measures' as const;

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
  const state = useClientsViewState();
  const [order, setOrder] = useListContext<ClientSort>('clients.sort', 'name');
  const [showArchived, setShowArchived] = useState(false);
  const refs = useClientsDataRefs(state, order);
  const detail = useClientByIdQuery(state.selectedClientId);
  const consumeClientId = useRoutinePlannerContextStore((store) => store.consumeClientId);
  const quickIntent = useQuickCreateStore((current) => current.intent);
  useEffect(() => {
    if (quickIntent !== 'client') return;
    useQuickCreateStore.getState().consume();
    refs.form.onOpenModal();
  }, [quickIntent, refs.form]);
  useEffect(() => {
    const clientIdFromPlanner = consumeClientId();
    if (clientIdFromPlanner) state.open(clientIdFromPlanner, 'profile', true);
  }, [consumeClientId]);
  const selected = detail.data ?? null;
  return buildClientsViewModel(refs, selected, state, onRouteChange, t, order, setOrder, showArchived, setShowArchived);
}

function buildClientsViewModel(
  refs: ReturnType<typeof useClientsDataRefs>,
  selectedClient: null | SelectedClient,
  state: ReturnType<typeof useClientsViewState>,
  onRouteChange: Props['onRouteChange'],
  t: ReturnType<typeof useTranslation>['t'],
  order: ClientSort,
  onOrderChange: (order: ClientSort) => void,
  showArchived: boolean,
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const actions = readViewModelActions(state);
  const selectedClientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim() : '';
  return {
    ...refs.form,
    clients: refs.clientsQuery.items,
    clientsError: refs.clientsQuery.error,
    clientsLoading: refs.clientsQuery.isLoading,
    objectiveOptions: refs.objectiveOptions,
    onListScroll: (event: Parameters<typeof loadNextPage>[0]) => loadNextPage(event, refs.clientsQuery),
    onRetryClients: () => void refs.clientsQuery.refetch(),
    ...actions,
    onRouteChange,
    order,
    onOrderChange,
    screenMode: state.screenMode,
    selectedClient,
    selectedClientId: state.selectedClientId,
    selectedClientName,
    showArchived,
    onToggleArchived: () => setShowArchived((value) => !value),
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
    onOpenCompareScreen: (clientId: string) => state.open(clientId, 'compare'),
    onOpenMeasuresScreen: (clientId: string) => state.open(clientId, 'measures'),
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

function useClientsDataRefs(state: ReturnType<typeof useClientsViewState>, order: ClientSort) {
  const clientsQuery = useClientsPagedQuery({
    objective: state.objectiveFilter === 'ALL' ? undefined : state.objectiveFilter,
    search: state.searchValue,
    sort: order,
  });
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

function objectiveChoices(options: Array<{ label: string }>, t: (key: string) => string) {
  return [
    { label: t('coach.clients.filters.allObjectives'), value: 'ALL' },
    ...options.map((item) => ({ label: item.label, value: item.label })),
  ];
}

export type ViewProps = ReturnType<typeof useClientsViewModel>;

function ClientsView(props: ViewProps): React.JSX.Element {
  const compact = useBreakpoint() !== 'lg';
  const scrollRef = useRef<ScrollView>(null);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [props.screenMode, props.selectedClientId]);
  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={compact ? [styles.page, styles.pageCompact] : styles.page}
      onScroll={props.onListScroll}
      scrollEventThrottle={200}
    >
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
  if (props.screenMode === 'compare' && props.selectedClientId) {
    return renderComparePage(props);
  }
  if (props.screenMode === 'measures' && props.selectedClientId) {
    return renderMeasuresPage(props);
  }
  if ((props.screenMode === 'profile' || props.screenMode === 'profileEdit') && props.selectedClientId) {
    return renderProfilePage(props);
  }
  return (
    <>
      <Header count={props.clients.length} onToggleArchived={props.onToggleArchived} t={props.t} />
      <OnboardingCard />
      <View style={styles.formCard}>{renderCta(props)}</View>
      {renderCreateResult(props)}
      <View style={styles.listCard}>
        <ClientsDirectoryPanel
          clients={props.clients}
          clientsError={props.clientsError}
          clientsLoading={props.clientsLoading}
          objectiveFilter={props.objectiveFilter}
          objectiveOptions={objectiveChoices(props.objectiveOptions, props.t)}
          onObjectiveFilterChange={props.onObjectiveFilterChange}
          onCreateClient={props.onOpenModal}
          onOrderChange={props.onOrderChange}
          onRetry={props.onRetryClients}
          onSearchValueChange={props.onSearchValueChange}
          onSelectClient={props.onSelectClient}
          order={props.order}
          searchValue={props.searchValue}
          selectedClientId={props.selectedClientId}
          t={props.t}
        />
      </View>
      <ArchivedClientsDrawer onClose={props.onToggleArchived} t={props.t} visible={props.showArchived} />
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
      onRequestIntakeChange={props.setRequestIntake}
      onSelectAvatar={props.setAvatarUrl}
      requestIntake={props.requestIntake}
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

function Header(props: { count: number; onToggleArchived: () => void; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>{props.t('coach.clients.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.clients.subtitle')}</Text>
      <View style={styles.managementSummary}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`${props.t('coach.clients.total')}: ${props.count}`}</Text>
        </View>
        <Button
          label={props.t('coach.clients.archived.open')}
          onPress={props.onToggleArchived}
          size="sm"
          variant="secondary"
        />
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
      onOpenCompareScreen={props.onOpenCompareScreen}
      onOpenMeasuresScreen={props.onOpenMeasuresScreen}
      onRouteChange={props.onRouteChange}
    />
  );
}

function renderNutritionPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_NUTRITION} view={props} />
      <View style={styles.profileCard}>
        <ClientNutritionPlanScreen
          clientId={props.selectedClientId}
          clientName={props.selectedClientName}
          onRouteChange={props.onRouteChange}
        />
      </View>
    </>
  );
}

function renderMoodPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_MOOD} view={props} />
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

function renderComparePage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_COMPARE} view={props} />
      <View style={styles.profileCard}>
        <ClientCompareScreen clientId={props.selectedClientId} t={props.t} />
      </View>
    </>
  );
}

function renderMeasuresPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_MEASURES} view={props} />
      <View style={styles.profileCard}>
        <ClientMeasuresScreen clientId={props.selectedClientId} t={props.t} />
      </View>
    </>
  );
}

function renderTestsPage(props: ViewProps): React.JSX.Element {
  return (
    <>
      <CrumbBar mode={MODE_TESTS} view={props} />
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
      <CrumbBar mode={editing ? 'edit' : 'profile'} view={props} />
      <View style={styles.profileCard}>{editing ? renderProfileEdit(props) : renderProfile(props)}</View>
    </>
  );
}
