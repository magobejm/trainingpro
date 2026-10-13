import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Dumbbell } from 'lucide-react';
import { colors, fontSize, IconButton, radius, space } from '@trainerpro/ui';
import { useBranding } from '../data/hooks/useBranding';

const MENU_GLYPH = '\u2630';

export function SidebarIdentity(props: { compact?: boolean; roleLabel: string; title: string }): React.JSX.Element {
  const branding = useBranding();
  return (
    <View style={[styles.identityCard, props.compact ? styles.identityCompact : null]}>
      <View style={styles.avatarStub}>
        {branding.data?.brandLogoUrl ? (
          <Image
            source={{ uri: branding.data.brandLogoUrl }}
            accessibilityLabel={props.title}
            resizeMode={'contain'}
            style={{ height: 36, width: 36 }}
          />
        ) : (
          <Dumbbell color={colors.onPrimary} size={24} />
        )}
      </View>
      {props.compact ? null : (
        <View style={styles.identityTextWrap}>
          <Text style={styles.logo}>{props.title}</Text>
          <Text style={styles.logoSubtitle}>{props.roleLabel}</Text>
        </View>
      )}
    </View>
  );
}

export function TopBar(props: {
  compact?: boolean;
  menuLabel?: string;
  onMenuPress?: () => void;
  roleLabel: string;
  title: string;
}): React.JSX.Element {
  return (
    <View style={[styles.topbar, props.compact ? styles.topbarCompact : null]}>
      <View style={styles.topbarLeft}>
        {props.onMenuPress ? (
          <IconButton
            accessibilityLabel={props.menuLabel ?? props.title}
            icon={(color) => <Text style={[styles.menuGlyph, { color }]}>{MENU_GLYPH}</Text>}
            onPress={props.onMenuPress}
            size={40}
          />
        ) : null}
        <View style={styles.topbarTitleWrap}>
          <Text numberOfLines={1} style={styles.topbarTitle}>
            {props.title}
          </Text>
          <Text style={styles.topbarSubtitle}>{props.roleLabel}</Text>
        </View>
      </View>
      {props.compact ? null : (
        <View style={styles.topbarRight}>
          <View style={styles.topbarIconButton} />
          <View style={styles.topbarIconButton} />
          <View style={styles.topbarStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.topbarStatusLabel}>{props.roleLabel}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  identityCompact: {
    justifyContent: 'center',
  },
  menuGlyph: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  topbarCompact: {
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  topbarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: space.md,
  },
  topbarTitleWrap: {
    flexShrink: 1,
  },
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
    color: colors.textInverse,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: colors.textInverseMuted,
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
