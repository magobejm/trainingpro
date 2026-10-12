import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dumbbell } from 'lucide-react';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export function SidebarIdentity(props: { roleLabel: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.identityCard}>
      <View style={styles.avatarStub}>
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Dumbbell color={colors.surface} size={24} />
      </View>
      <View style={styles.identityTextWrap}>
        <Text style={styles.logo}>{props.title}</Text>
        <Text style={styles.logoSubtitle}>{props.roleLabel}</Text>
      </View>
    </View>
  );
}

export function TopBar(props: { roleLabel: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.topbar}>
      <View>
        <Text style={styles.topbarTitle}>{props.title}</Text>
        <Text style={styles.topbarSubtitle}>{props.roleLabel}</Text>
      </View>
      <View style={styles.topbarRight}>
        <View style={styles.topbarIconButton} />
        <View style={styles.topbarIconButton} />
        <View style={styles.topbarStatus}>
          <View style={styles.onlineDot} />
          <Text style={styles.topbarStatusLabel}>{props.roleLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarStub: {
    alignItems: 'center',
    backgroundColor: colors.primary, // Bright blue from prototype
    borderRadius: radius.lg,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  identityCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
  },
  identityTextWrap: {
    flex: 1,
  },
  logo: {
    color: colors.surface,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: -1,
    textTransform: 'uppercase',
  },
  onlineDot: {
    backgroundColor: colors.success,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  topbar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  topbarIconButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  topbarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  topbarStatus: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  topbarStatusLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  topbarSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  topbarTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
});
