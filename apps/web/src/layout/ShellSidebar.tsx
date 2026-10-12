import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { styles } from '../App.styles';
import { buildNavSections, formatBadge } from './nav-groups';
import { SidebarIdentity } from './ShellChrome';
import { SidebarUserPanel } from './SidebarUserPanel';
import type { ShellNavItem, ShellRoute } from './usePersistentShellRoute';

export type SidebarVariant = 'compact' | 'full';

export type ShellSidebarProps = {
  badges: Partial<Record<ShellRoute, number>>;
  email: string;
  items: ShellNavItem[];
  onLogout: () => void;
  onSelect: (route: ShellRoute) => void;
  route: ShellRoute;
  t: (key: string) => string;
  variant: SidebarVariant;
};

export function ShellSidebar(props: ShellSidebarProps): React.JSX.Element {
  const compact = props.variant === 'compact';
  const { t } = props;
  return (
    <View style={[styles.sidebar, compact ? styles.sidebarCompact : null]}>
      <SidebarIdentity compact={compact} roleLabel={t('app.brand.subtitle')} title={t('app.title')} />
      <View style={[styles.navList, compact ? styles.navListCompact : null]}>
        {buildNavSections(props.items).map((section, index) => (
          <View key={section.group} style={styles.navSection}>
            {compact ? (
              index > 0 ? (
                <View style={styles.navDivider} />
              ) : null
            ) : (
              <Text style={styles.navGroupTitle}>{t(`app.nav.group.${section.group}`)}</Text>
            )}
            {section.items.map((item) => (
              <NavButton
                badge={formatBadge(props.badges[item.id])}
                compact={compact}
                isActive={props.route === item.id}
                item={item}
                key={item.id}
                onPress={() => props.onSelect(item.id)}
                t={t}
              />
            ))}
          </View>
        ))}
      </View>
      <SidebarUserPanel compact={compact} email={props.email} fallbackName={t('app.user.fallbackName')} t={t} />
      <Pressable
        accessibilityLabel={t('app.nav.logout')}
        accessibilityRole="button"
        onPress={props.onLogout}
        style={[styles.logoutButton, compact ? styles.logoutCompact : null]}
      >
        <Text style={styles.logoutLabel}>{compact ? '⏻' : t('app.nav.logout')}</Text>
      </Pressable>
    </View>
  );
}

type HoverState = { hovered?: boolean };

type NavButtonProps = {
  badge: null | string;
  compact: boolean;
  isActive: boolean;
  item: ShellNavItem;
  onPress: () => void;
  t: (key: string) => string;
};

function NavButton(props: NavButtonProps): React.JSX.Element {
  const label = props.t(props.item.menuLabelKey ?? props.item.labelKey);
  return (
    <Pressable
      accessibilityLabel={props.badge ? `${label} (${props.badge})` : label}
      accessibilityRole="link"
      aria-current={props.isActive ? 'page' : undefined}
      onPress={props.onPress}
      style={[styles.navButton, props.compact ? styles.navButtonCompact : null]}
      {...tooltip(props.compact ? label : undefined)}
    >
      {(state) => <NavButtonContent {...props} hovered={Boolean((state as HoverState).hovered)} label={label} />}
    </Pressable>
  );
}

function NavButtonContent(props: NavButtonProps & { hovered: boolean; label: string }): React.JSX.Element {
  const { isActive, hovered, item } = props;
  const lit = isActive || hovered;
  const iconColor = lit ? '#ffffff' : '#94a3b8';
  const gradientSize = lit ? '100% 100%' : '0% 100%';
  const badgeStyle = item.badgeColor && !lit ? { backgroundColor: item.badgeColor } : {};
  return (
    <>
      <View style={[styles.navButtonGradient, { backgroundSize: gradientSize } as ViewStyle]} />
      {isActive ? <View style={styles.activeIndicator} /> : null}
      <View style={[styles.navRow, props.compact ? styles.navRowCompact : null]}>
        <View
          style={[
            styles.navIconBadge,
            props.compact ? styles.navIconCompact : null,
            lit && styles.navIconBadgeActive,
            badgeStyle,
          ]}
        >
          {item.icon({ color: iconColor, size: 20 })}
          {props.compact && props.badge ? <Count compact value={props.badge} /> : null}
        </View>
        {props.compact ? null : (
          <>
            <Text
              style={[styles.navLabel, isActive && styles.navLabelActive, hovered && !isActive && styles.navLabelHovered]}
            >
              {props.label}
            </Text>
            {props.badge ? <Count value={props.badge} /> : null}
          </>
        )}
      </View>
    </>
  );
}

function Count(props: { compact?: boolean; value: string }): React.JSX.Element {
  return (
    <View style={[styles.navCount, props.compact ? styles.navCountCompact : null]}>
      <Text style={styles.navCountText}>{props.value}</Text>
    </View>
  );
}

// Tooltip nativo del navegador en la barra de iconos.
function tooltip(text?: string): object {
  return text ? { title: text } : {};
}
