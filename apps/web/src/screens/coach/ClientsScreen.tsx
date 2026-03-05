import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import '../../i18n';
import { useCreateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import { styles } from './clients-screen.styles';
import { ClientProfileScreen } from './ClientProfileScreen';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { ClientSelectionStrip } from './components/ClientSelectionStrip';
import { CreateClientModal } from './components/CreateClientModal';
import { CreateClientResultBanner } from './components/CreateClientResultBanner';
import { EmptyClientSelectionPanel } from './components/EmptyClientSelectionPanel';
import { useClientCreateForm } from './useClientCreateForm';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';

type Props = {
  onRouteChange?: (route: ShellRoute) => void;
};

export function ClientsScreen(props: Props): React.JSX.Element {
  const vm = useClientsViewModel(props.onRouteChange);
  return <ClientsView {...vm} />;
}

function useClientsViewModel(onRouteChange?: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const createMutation = useCreateClientMutation();
  const form = useClientCreateForm(createMutation);
  const [selectedClientId, setSelectedClientId] = useState('');
  const consumeClientId = useRoutinePlannerContextStore((state) => state.consumeClientId);
  useEffect(() => {
    const clientIdFromPlanner = consumeClientId();
    if (clientIdFromPlanner) {
      setSelectedClientId(clientIdFromPlanner);
    }
  }, [consumeClientId]);
  return {
    ...form,
    clients: clientsQuery.data ?? [],
    clientsError: clientsQuery.error,
    clientsLoading: clientsQuery.isLoading,
    onSelectClient: setSelectedClientId,
    onRouteChange,
    selectedClientId,
    t,
  };
}

type ViewProps = ReturnType<typeof useClientsViewModel>;

function ClientsView(props: ViewProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Header count={props.clients.length} t={props.t} />
        <View style={styles.formCard}>{renderCta(props)}</View>
        {renderCreateResult(props)}
        <View style={styles.listCard}>{renderList(props)}</View>
        <View style={styles.profileCard}>{renderProfile(props)}</View>
        <CreateClientDialog props={props} />
      </View>
    </ScrollView>
  );
}

function CreateClientDialog({ props }: { props: ViewProps }): React.JSX.Element {
  return (
    <CreateClientModal
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

function renderList(props: ViewProps): React.JSX.Element {
  if (props.clientsError) {
    return <Text style={styles.empty}>{props.t('coach.clients.error')}</Text>;
  }
  const emptyLabel = props.clientsLoading
    ? props.t('coach.clients.loading')
    : props.t('coach.clients.empty');
  const items = props.clients
    .map((client) => ({
      avatarUrl: client.avatarUrl,
      email: client.email,
      id: client.id,
      name: `${client.firstName} ${client.lastName}`.trim(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  return (
    <ClientSelectionStrip
      emptyLabel={emptyLabel}
      items={items}
      loading={props.clientsLoading}
      onSelect={props.onSelectClient}
      selectedId={props.selectedClientId}
      showArrows
    />
  );
}

function renderProfile(props: ViewProps): React.JSX.Element {
  if (!props.selectedClientId) {
    return <EmptyClientSelectionPanel t={props.t} />;
  }
  return (
    <ClientProfileScreen
      clientId={props.selectedClientId}
      onArchived={() => props.onSelectClient('')}
      onRouteChange={props.onRouteChange}
    />
  );
}
