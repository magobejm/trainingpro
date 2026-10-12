import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import type { ActiveRole } from '../../data/api-client';
import { useMeQuery } from '../../data/hooks/useMeQuery';
import { useAuthStore } from '../../store/auth.store';
import { EmptyState, colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  accent: colors.primary,
  bg: colors.surfaceMuted,
  card: colors.surface,
  cardBorder: colors.border,
  muted: colors.textMuted,
  text: colors.text,
};

export function RoleSelectScreen(): React.JSX.Element {
  const vm = useRoleSelectViewModel();
  return <RoleSelectCard {...vm} />;
}

function useRoleSelectViewModel() {
  const { t } = useTranslation();
  const meQuery = useMeQuery();
  const activeRole = useAuthStore((state) => state.activeRole);
  const availableRoles = useAuthStore((state) => state.availableRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const hasRoles = availableRoles.length > 0;
  const onSelectRole = (role: ActiveRole): void => {
    setActiveRole(role);
  };
  const isLoading = meQuery.isPending;
  const hasError = Boolean(meQuery.error);
  return { activeRole, availableRoles, hasError, hasRoles, isLoading, onSelectRole, t };
}

type RoleSelectCardProps = ReturnType<typeof useRoleSelectViewModel>;

function RoleSelectCard(props: RoleSelectCardProps): React.JSX.Element {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{props.t('auth.roleSelect.title')}</Text>
        <Text style={styles.subtitle}>{props.t('auth.roleSelect.subtitle')}</Text>
        {renderRoleOptions(props)}
      </View>
    </View>
  );
}

function renderRoleOptions(props: RoleSelectCardProps): React.JSX.Element {
  if (props.isLoading) {
    return <EmptyState title={props.t('auth.roleSelect.loading')} />;
  }
  if (props.hasError) {
    return <EmptyState title={props.t('auth.roleSelect.error')} />;
  }
  if (!props.hasRoles) {
    return <EmptyState title={props.t('auth.roleSelect.empty')} />;
  }
  return (
    <View style={styles.list}>
      {props.availableRoles.map((role) => (
        <RoleOption
          isActive={role === props.activeRole}
          key={role}
          label={props.t(`auth.role.${role}`)}
          onPress={() => props.onSelectRole(role)}
        />
      ))}
    </View>
  );
}

type RoleOptionProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function RoleOption(props: RoleOptionProps): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={resolveRoleStyle(props.isActive)}>
      <Text style={resolveRoleTextStyle(props.isActive)}>{props.label}</Text>
    </Pressable>
  );
}

function resolveRoleStyle(isActive: boolean) {
  return [styles.roleButton, isActive ? styles.roleButtonActive : null];
}

function resolveRoleTextStyle(isActive: boolean) {
  return [styles.roleLabel, isActive ? styles.roleLabelActive : null];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    borderWidth: 1,
    padding: space.xl,
    width: 460,
  },
  list: {
    gap: space.md,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  roleButton: {
    backgroundColor: COLORS.bg,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  roleButtonActive: {
    backgroundColor: COLORS.accent,
  },
  roleLabel: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  roleLabelActive: {
    color: COLORS.card,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginBottom: space.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: space.sm,
  },
});
