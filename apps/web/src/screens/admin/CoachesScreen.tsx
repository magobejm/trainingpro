import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useArchiveCoachMutation, useToggleCoachMutation } from '../../data/hooks/useCoachMutations';
import { useCoachesQuery, type CoachView } from '../../data/hooks/useCoachesQuery';

const COLORS = {
  accent: '#1c74e9',
  border: '#dfe8f5',
  card: '#ffffff',
  page: '#f6f7f8',
  text: '#111418',
  textMuted: '#6a7381',
  warning: '#d92d20',
};

export function CoachesScreen(): React.JSX.Element {
  const vm = useCoachesViewModel();
  return <CoachesView {...vm} />;
}

function useCoachesViewModel() {
  const { t } = useTranslation();
  const coachesQuery = useCoachesQuery();
  const toggleMutation = useToggleCoachMutation();
  const archiveMutation = useArchiveCoachMutation();
  const items = coachesQuery.data ?? [];
  return {
    activeCount: items.filter((item) => item.isActive).length,
    items,
    onArchive: (coachMembershipId: string) => archiveMutation.mutate(coachMembershipId),
    onToggle: (coach: CoachView) =>
      toggleMutation.mutate({
        coachMembershipId: coach.coachMembershipId,
        isActive: coach.isActive,
      }),
    t,
  };
}

type ViewProps = ReturnType<typeof useCoachesViewModel>;

function CoachesView(props: ViewProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Header activeCount={props.activeCount} totalCount={props.items.length} t={props.t} />
        <View style={styles.list}>{renderRows(props)}</View>
      </View>
    </ScrollView>
  );
}

function Header(props: {
  activeCount: number;
  t: (key: string) => string;
  totalCount: number;
}): React.JSX.Element {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>{props.t('admin.coaches.title')}</Text>
      <Text style={styles.subtitle}>{props.t('admin.coaches.subtitle')}</Text>
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

function renderRows(props: ViewProps): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.t('admin.coaches.empty')}</Text>;
  }
  return (
    <>
      {props.items.map((coach) => (
        <CoachRow
          coach={coach}
          key={coach.coachMembershipId}
          onArchive={props.onArchive}
          onToggle={props.onToggle}
          t={props.t}
        />
      ))}
    </>
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
        <Pressable
          onPress={() => props.onArchive(props.coach.coachMembershipId)}
          style={styles.dangerButton}
        >
          <Text style={styles.dangerLabel}>{props.t('admin.coaches.archive')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AvatarBadge(props: { label: string }): React.JSX.Element {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarLabel}>{readInitials(props.label)}</Text>
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#eaf2ff',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarLabel: {
    color: '#225fdb',
    fontSize: 12,
    fontWeight: '800',
  },
  container: {
    gap: 14,
    maxWidth: 980,
    width: '100%',
  },
  dangerButton: {
    alignItems: 'center',
    borderColor: COLORS.warning,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  dangerLabel: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  ghostButton: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  ghostLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  list: {
    gap: 10,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flexGrow: 1,
    padding: 22,
  },
  pill: {
    backgroundColor: '#f2f6fd',
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pillValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rowIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  rowStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
