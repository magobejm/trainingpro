import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LIGHT } from './light';

const MODAL_ANIMATION = 'fade' as const;

type IconProps = { size?: number; color?: string };

function IconUser({ size = 20, color = LIGHT.accent }: IconProps) {
  return <Text style={{ color, fontSize: size }}>{'👤'}</Text>;
}
function IconCalendar({ size = 18, color = LIGHT.textOnNavyMuted }: IconProps) {
  return <Text style={{ color, fontSize: size }}>{'📅'}</Text>;
}
function IconChevron({ size = 18, color = LIGHT.accentMuted }: IconProps) {
  return <Text style={{ color, fontSize: size, fontWeight: '700' }}>{'›'}</Text>;
}
function IconBack({ size = 20, color = LIGHT.text }: IconProps) {
  return <Text style={{ color, fontSize: size, fontWeight: '700' }}>{'←'}</Text>;
}
function IconChat({ size = 22, color = LIGHT.accentMuted }: IconProps) {
  return <Text style={{ color, fontSize: size }}>{'💬'}</Text>;
}
function IconHome({ size = 24, color = LIGHT.accentMuted }: IconProps) {
  return <Text style={{ color, fontSize: size }}>{'🏠'}</Text>;
}
function IconMenu({ size = 22, color = LIGHT.accentMuted }: IconProps) {
  return <Text style={{ color, fontSize: size }}>{'☰'}</Text>;
}

export function Card(props: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.JSX.Element {
  return <View style={[ps.card, props.style]}>{props.children}</View>;
}

export function ActionCard(props: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        ps.actionCard,
        props.disabled && ps.actionCardDisabled,
        pressed && !props.disabled && ps.actionCardPressed,
      ]}
    >
      <View style={ps.actionIconWrap}>{props.icon}</View>
      <View style={ps.actionTextWrap}>
        <Text style={ps.actionTitle}>{props.title}</Text>
        {props.subtitle ? <Text style={ps.actionSubtitle}>{props.subtitle}</Text> : null}
      </View>
      <View style={ps.actionChevronWrap}>
        <IconChevron color={LIGHT.accent} />
      </View>
    </Pressable>
  );
}

export function StatSquare(props: { label: string; value: string | number | null }): React.JSX.Element {
  return (
    <View style={ps.statSquare}>
      <Text style={ps.statValue}>{props.value ?? '–'}</Text>
      <Text style={ps.statLabel}>{props.label}</Text>
    </View>
  );
}

export function InfoButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [ps.infoButton, pressed && ps.infoButtonPressed]}>
      <Text style={ps.infoButtonText}>{props.label}</Text>
    </Pressable>
  );
}

export function Badge(props: { label: string; variant?: 'default' | 'success' | 'navy' }): React.JSX.Element {
  const variant = props.variant ?? 'default';
  return (
    <View style={[ps.badge, variant === 'success' && ps.badgeSuccess, variant === 'navy' && ps.badgeNavy]}>
      <Text style={[ps.badgeText, variant === 'success' && ps.badgeTextSuccess, variant === 'navy' && ps.badgeTextNavy]}>
        {props.label}
      </Text>
    </View>
  );
}

export function IconButton(props: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[ps.iconButton, props.style]}>
      {props.children}
    </Pressable>
  );
}

export function BackHeader(props: { onBack: () => void; title?: string }): React.JSX.Element {
  return (
    <View style={ps.backHeader}>
      <IconButton onPress={props.onBack}>
        <IconBack />
      </IconButton>
      {props.title ? <Text style={ps.backHeaderTitle}>{props.title}</Text> : null}
    </View>
  );
}

export type TabId = 'chat' | 'home' | 'more';

export function BottomNav(props: {
  active: TabId;
  onChange: (tab: TabId) => void;
  labels: { chat: string; home: string; more: string };
}): React.JSX.Element {
  return (
    <View style={ps.bottomNavWrap}>
      <View style={ps.bottomNav}>
        <NavItem
          active={props.active === 'chat'}
          icon={<IconChat color={props.active === 'chat' ? LIGHT.accentDark : LIGHT.accentMuted} />}
          label={props.labels.chat}
          onPress={() => props.onChange('chat')}
        />
        <NavItem
          active={props.active === 'home'}
          icon={<IconHome color={props.active === 'home' ? LIGHT.accentDark : LIGHT.accentMuted} />}
          label={props.labels.home}
          onPress={() => props.onChange('home')}
        />
        <NavItem
          active={props.active === 'more'}
          icon={<IconMenu color={props.active === 'more' ? LIGHT.accentDark : LIGHT.accentMuted} />}
          label={props.labels.more}
          onPress={() => props.onChange('more')}
        />
      </View>
    </View>
  );
}

function NavItem(props: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={ps.navItem}>
      {props.icon}
      <Text style={[ps.navLabel, props.active && ps.navLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

export function AppModal(props: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
}): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={ps.modalOverlay}>
        <View style={ps.modalCard}>
          <View style={ps.modalHeader}>
            <Text style={ps.modalTitle}>{props.title}</Text>
            <Pressable onPress={props.onClose} style={ps.modalCloseBtn}>
              <Text style={ps.modalCloseText}>{'✕'}</Text>
            </Pressable>
          </View>
          <ScrollView style={ps.modalBody} contentContainerStyle={ps.modalBodyInner}>
            {props.children}
          </ScrollView>
          {props.onConfirm ? (
            <View style={ps.modalFooter}>
              <Pressable onPress={props.onConfirm} style={ps.modalConfirmBtn}>
                <Text style={ps.modalConfirmText}>{props.confirmLabel ?? 'OK'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function ScreenRoot(props: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.JSX.Element {
  return <View style={[ps.screenRoot, props.style]}>{props.children}</View>;
}

export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger';
}): React.JSX.Element {
  const variant = props.variant ?? 'primary';
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        ps.primaryBtn,
        variant === 'success' && ps.primaryBtnSuccess,
        variant === 'danger' && ps.primaryBtnDanger,
        props.disabled && ps.primaryBtnDisabled,
      ]}
    >
      <Text style={ps.primaryBtnText}>{props.label}</Text>
    </Pressable>
  );
}

export { IconUser, IconCalendar, IconChevron, IconBack, IconChat, IconHome, IconMenu };

const ps = StyleSheet.create({
  screenRoot: {
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
  },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    shadowColor: LIGHT.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 20,
  },
  actionCardPressed: { backgroundColor: LIGHT.bgSoft },
  actionCardDisabled: { opacity: 0.6 },
  actionIconWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  actionTextWrap: { flex: 1, gap: 2 },
  actionTitle: { color: LIGHT.textStrong, fontSize: 17, fontWeight: '600' },
  actionSubtitle: { color: LIGHT.textMuted, fontSize: 14, marginTop: 2 },
  actionChevronWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  statSquare: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  statValue: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  statLabel: {
    color: LIGHT.accentMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoButton: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 80,
    padding: 16,
  },
  infoButtonPressed: { backgroundColor: LIGHT.bgSoft },
  infoButtonText: {
    color: LIGHT.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeSuccess: { backgroundColor: LIGHT.emeraldSoft },
  badgeNavy: { backgroundColor: LIGHT.bgNavy },
  badgeText: { color: LIGHT.accentDark, fontSize: 11, fontWeight: '700' },
  badgeTextSuccess: { color: LIGHT.success },
  badgeTextNavy: { color: LIGHT.textOnNavy },
  iconButton: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  backHeaderTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 18, fontWeight: '800' },
  bottomNavWrap: {
    bottom: 0,
    left: 0,
    paddingBottom: 24,
    paddingHorizontal: 40,
    paddingTop: 32,
    position: 'absolute',
    right: 0,
  },
  bottomNav: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navItem: { alignItems: 'center', gap: 4, minWidth: 60, padding: 4 },
  navLabel: { color: LIGHT.accentMuted, fontSize: 10, fontWeight: '600' },
  navLabelActive: { color: LIGHT.accentDark },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 16, fontWeight: '800' },
  modalCloseBtn: { padding: 8 },
  modalCloseText: { color: LIGHT.textMuted, fontSize: 18 },
  modalBody: { maxHeight: 360 },
  modalBodyInner: { padding: 16 },
  modalFooter: {
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    padding: 16,
  },
  modalConfirmBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    paddingVertical: 14,
  },
  modalConfirmText: { color: LIGHT.textOnNavy, fontWeight: '800' },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    paddingVertical: 16,
  },
  primaryBtnSuccess: { backgroundColor: LIGHT.emeraldBg },
  primaryBtnDanger: { backgroundColor: LIGHT.redBg },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: LIGHT.textOnNavy, fontSize: 16, fontWeight: '800' },
});
