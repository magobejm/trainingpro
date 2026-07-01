import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import type { ActiveRole } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import { LIGHT } from '../../theme/light';

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
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>{'👤'}</Text>
        </View>
        <Text style={styles.appName}>{props.t('app.title')}</Text>
      </View>
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
  page: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 12,
    width: 72,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    color: LIGHT.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    shadowColor: LIGHT.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    width: '100%',
  },
  empty: {
    color: LIGHT.textMuted,
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  roleButton: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roleButtonActive: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accentDark,
  },
  roleLabel: {
    color: LIGHT.textStrong,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleLabelActive: {
    color: LIGHT.textOnNavy,
  },
  subtitle: {
    color: LIGHT.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
});
