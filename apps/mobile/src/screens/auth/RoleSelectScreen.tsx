import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import type { ActiveRole } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

const COLORS = {
  accent: '#2864dc',
  bg: '#f3f6fb',
  card: '#ffffff',
  cardBorder: '#dde5f0',
  muted: '#6a7686',
  text: '#0e1725',
};

export function RoleSelectScreen(): React.JSX.Element {
  const vm = useRoleSelectViewModel();
  return <RoleSelectCard {...vm} />;
}

function useRoleSelectViewModel() {
  const { t } = useTranslation();
  const activeRole = useAuthStore((state) => state.activeRole);
  const availableRoles = useAuthStore((state) => state.availableRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const hasRoles = availableRoles.length > 0;
  const onSelectRole = (role: ActiveRole): void => {
    setActiveRole(role);
  };
  return { activeRole, availableRoles, hasRoles, onSelectRole, t };
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
  if (!props.hasRoles) {
    return <Text style={styles.empty}>{props.t('auth.roleSelect.empty')}</Text>;
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
    padding: 20,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  roleButton: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roleButtonActive: {
    backgroundColor: COLORS.accent,
  },
  roleLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  roleLabelActive: {
    color: COLORS.card,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
});
