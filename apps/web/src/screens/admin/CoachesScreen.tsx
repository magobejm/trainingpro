import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import '../../i18n';
import {
  useArchiveCoachMutation,
  useCreateCoachMutation,
  useRestoreCoachMutation,
  useToggleCoachMutation,
  type CreateCoachResult,
} from '../../data/hooks/useCoachMutations';
import { useArchivedCoachesQuery, useCoachesQuery, type CoachView } from '../../data/hooks/useCoachesQuery';
import { COLORS, styles } from './CoachesScreen.styles';

type Tab = 'active' | 'archived';

export function CoachesScreen(): React.JSX.Element {
  const vm = useCoachesViewModel();
  return <CoachesView {...vm} />;
}

function useCoachesViewModel() {
  const { t } = useTranslation();
  const coachesQuery = useCoachesQuery();
  const archivedQuery = useArchivedCoachesQuery();
  const toggleMutation = useToggleCoachMutation();
  const archiveMutation = useArchiveCoachMutation();
  const restoreMutation = useRestoreCoachMutation();
  const createMutation = useCreateCoachMutation();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createResult, setCreateResult] = useState<CreateCoachResult | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const refetchArchived = archivedQuery.refetch;
  useEffect(() => {
    if (activeTab === 'archived') {
      void refetchArchived();
    }
  }, [activeTab, refetchArchived]);

  const activeItems = coachesQuery.data ?? [];
  const archivedItems = archivedQuery.data ?? [];

  const onArchive = (coachMembershipId: string) => archiveMutation.mutate(coachMembershipId);
  const onToggle = (coach: CoachView) =>
    toggleMutation.mutate({ coachMembershipId: coach.coachMembershipId, isActive: coach.isActive });
  const onRestore = (coachMembershipId: string) => restoreMutation.mutate(coachMembershipId);

  const onSubmitCreate = (email: string) => {
    createMutation.mutate(email, {
      onSuccess: (result) => {
        setCreateResult(result);
        setShowCreateModal(false);
      },
    });
  };

  const onCopyPassword = (password: string) => {
    const scope = globalThis as { navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } } };
    void scope.navigator?.clipboard?.writeText?.(password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const onDismissResult = () => setCreateResult(null);

  return {
    activeItems,
    activeTab,
    archivedItems,
    createMutation,
    createResult,
    onArchive,
    onCopyPassword,
    onDismissResult,
    onRestore,
    onSubmitCreate,
    onToggle,
    passwordCopied,
    setActiveTab,
    setShowCreateModal,
    showCreateModal,
    t,
    totalCount: activeItems.length + archivedItems.length,
  };
}

type ViewProps = ReturnType<typeof useCoachesViewModel>;

function CoachesView(props: ViewProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps={'handled'}>
      <View style={styles.container}>
        <Header
          activeCount={props.activeItems.filter((c) => c.isActive).length}
          onCreatePress={() => props.setShowCreateModal(true)}
          t={props.t}
          totalCount={props.totalCount}
        />
        <TabBar activeTab={props.activeTab} onSelect={props.setActiveTab} t={props.t} />
        {props.activeTab === 'active' ? (
          <ActiveList items={props.activeItems} onArchive={props.onArchive} onToggle={props.onToggle} t={props.t} />
        ) : (
          <ArchivedList items={props.archivedItems} onRestore={props.onRestore} t={props.t} />
        )}
      </View>
      <CreateCoachModal
        isLoading={props.createMutation.isPending}
        onClose={() => props.setShowCreateModal(false)}
        onSubmit={props.onSubmitCreate}
        t={props.t}
        visible={props.showCreateModal}
      />
      {props.createResult && (
        <ResultBanner
          onClose={props.onDismissResult}
          onCopyPassword={props.onCopyPassword}
          passwordCopied={props.passwordCopied}
          result={props.createResult}
          t={props.t}
        />
      )}
    </ScrollView>
  );
}

function Header(props: {
  activeCount: number;
  onCreatePress: () => void;
  t: (key: string) => string;
  totalCount: number;
}): React.JSX.Element {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroTitles}>
          <Text style={styles.title}>{props.t('admin.coaches.title')}</Text>
          <Text style={styles.subtitle}>{props.t('admin.coaches.subtitle')}</Text>
        </View>
        <Pressable onPress={props.onCreatePress} style={styles.createButton}>
          <Text style={styles.createButtonLabel}>{props.t('admin.coaches.create')}</Text>
        </Pressable>
      </View>
      <View style={styles.pillsRow}>
        <Pill label={props.t('admin.coaches.total')} value={String(props.totalCount)} />
        <Pill label={props.t('admin.coaches.status.active')} value={String(props.activeCount)} />
      </View>
    </View>
  );
}

function Pill(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{props.label}</Text>
      <Text style={styles.pillValue}>{props.value}</Text>
    </View>
  );
}

function TabBar(props: { activeTab: Tab; onSelect: (tab: Tab) => void; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      <TabButton
        active={props.activeTab === 'active'}
        label={props.t('admin.coaches.tabs.active')}
        onPress={() => props.onSelect('active')}
      />
      <TabButton
        active={props.activeTab === 'archived'}
        label={props.t('admin.coaches.tabs.archived')}
        onPress={() => props.onSelect('archived')}
      />
    </View>
  );
}

function TabButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.tabButton, props.active && styles.tabButtonActive]}>
      <Text style={[styles.tabButtonLabel, props.active && styles.tabButtonLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function ActiveList(props: {
  items: CoachView[];
  onArchive: (id: string) => void;
  onToggle: (coach: CoachView) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.t('admin.coaches.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {props.items.map((coach) => (
        <CoachRow
          coach={coach}
          key={coach.coachMembershipId}
          onArchive={props.onArchive}
          onToggle={props.onToggle}
          t={props.t}
        />
      ))}
    </View>
  );
}

function ArchivedList(props: {
  items: CoachView[];
  onRestore: (id: string) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.t('admin.coaches.archivedEmpty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {props.items.map((coach) => (
        <ArchivedCoachRow coach={coach} key={coach.coachMembershipId} onRestore={props.onRestore} t={props.t} />
      ))}
    </View>
  );
}

function CoachRow(props: {
  coach: CoachView;
  onArchive: (coachMembershipId: string) => void;
  onToggle: (coach: CoachView) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowIdentity}>
        <AvatarBadge label={props.coach.email} />
        <View>
          <Text style={styles.rowTitle}>{props.coach.email}</Text>
          <Text style={styles.rowStatus}>{readStatusLabel(props.coach.isActive, props.t)}</Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable onPress={() => props.onToggle(props.coach)} style={styles.ghostButton}>
          <Text style={styles.ghostLabel}>{readToggleLabel(props.coach.isActive, props.t)}</Text>
        </Pressable>
        <Pressable onPress={() => props.onArchive(props.coach.coachMembershipId)} style={styles.dangerButton}>
          <Text style={styles.dangerLabel}>{props.t('admin.coaches.archive')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ArchivedCoachRow(props: {
  coach: CoachView;
  onRestore: (coachMembershipId: string) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  const archivedDate = props.coach.archivedAt ? new Date(props.coach.archivedAt).toLocaleDateString() : '';
  return (
    <View style={[styles.row, styles.rowArchived]}>
      <View style={styles.rowIdentity}>
        <AvatarBadge label={props.coach.email} muted />
        <View>
          <Text style={[styles.rowTitle, styles.rowTitleMuted]}>{props.coach.email}</Text>
          {archivedDate ? (
            <Text style={styles.rowStatus}>
              {props.t('admin.coaches.archivedAt')} {archivedDate}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable onPress={() => props.onRestore(props.coach.coachMembershipId)} style={styles.successButton}>
          <Text style={styles.successLabel}>{props.t('admin.coaches.restore')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AvatarBadge(props: { label: string; muted?: boolean }): React.JSX.Element {
  return (
    <View style={[styles.avatar, props.muted && styles.avatarMuted]}>
      <Text style={[styles.avatarLabel, props.muted && styles.avatarLabelMuted]}>{readInitials(props.label)}</Text>
    </View>
  );
}

function CreateCoachModal(props: {
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  t: (key: string) => string;
  visible: boolean;
}): React.JSX.Element {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    props.onSubmit(trimmed);
    setEmail('');
  };

  const handleClose = () => {
    setEmail('');
    props.onClose();
  };

  return (
    <Modal animationType={'fade'} onRequestClose={handleClose} transparent visible={props.visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{props.t('admin.coaches.createModal.title')}</Text>
          <TextInput
            autoCapitalize={'none'}
            autoComplete={'email'}
            keyboardType={'email-address'}
            onChangeText={setEmail}
            placeholder={props.t('admin.coaches.createModal.emailPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            style={styles.modalInput}
            value={email}
          />
          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={styles.ghostButton}>
              <Text style={styles.ghostLabel}>{props.t('admin.coaches.createModal.cancel')}</Text>
            </Pressable>
            <Pressable
              disabled={props.isLoading || !email.trim()}
              onPress={handleSubmit}
              style={[styles.accentButton, (props.isLoading || !email.trim()) && styles.buttonDisabled]}
            >
              <Text style={styles.accentButtonLabel}>
                {props.isLoading
                  ? props.t('admin.coaches.createModal.loading')
                  : props.t('admin.coaches.createModal.submit')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ResultBanner(props: {
  onClose: () => void;
  onCopyPassword: (password: string) => void;
  passwordCopied: boolean;
  result: CreateCoachResult;
  t: (key: string) => string;
}): React.JSX.Element {
  const { temporaryPassword, userCreated } = props.result.credentials;
  return (
    <View style={styles.resultBanner}>
      <View style={styles.resultContent}>
        {userCreated && temporaryPassword ? (
          <>
            <Text style={styles.resultText}>{props.t('admin.coaches.createModal.successWithPassword')}</Text>
            <Text style={styles.resultPassword}>{temporaryPassword}</Text>
            <Pressable onPress={() => props.onCopyPassword(temporaryPassword)} style={styles.copyButton}>
              <Text style={styles.copyButtonLabel}>
                {props.passwordCopied
                  ? props.t('admin.coaches.createModal.passwordCopied')
                  : props.t('admin.coaches.createModal.copyPassword')}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.resultText}>{props.t('admin.coaches.createModal.success')}</Text>
        )}
      </View>
      <Pressable onPress={props.onClose} style={styles.resultClose}>
        <Text style={styles.resultCloseLabel}>{props.t('admin.coaches.createModal.dismiss')}</Text>
      </Pressable>
    </View>
  );
}

function readInitials(email: string): string {
  const token = email.split('@')[0] ?? '';
  const [a, b] = token.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return `${a ?? 'C'}${b ?? 'O'}`;
}

function readStatusLabel(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('admin.coaches.status.active') : t('admin.coaches.status.inactive');
}

function readToggleLabel(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('admin.coaches.deactivate') : t('admin.coaches.activate');
}
