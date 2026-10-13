import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  accent: colors.primary,
  bg: colors.surfaceMuted,
  nav: colors.text,
  navBorder: colors.text,
  shell: colors.surfaceMuted,
  textMuted: colors.textMuted,
  textActive: colors.border,
  textDefault: colors.border,
  white: colors.surface,
};

const NAV_COUNT_SIZE = 20;

export const styles = StyleSheet.create({
  logoutCompact: {
    paddingHorizontal: 0,
  },
  navCount: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    height: NAV_COUNT_SIZE,
    justifyContent: 'center',
    marginLeft: 'auto',
    minWidth: NAV_COUNT_SIZE,
    paddingHorizontal: space.xs,
    zIndex: 10,
  },
  navCountCompact: {
    height: 16,
    marginLeft: 0,
    minWidth: 16,
    position: 'absolute',
    right: -8,
    top: -6,
  },
  navCountText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  navDivider: {
    backgroundColor: colors.borderStrong,
    height: 1,
    marginVertical: space.xs,
    opacity: 0.4,
  },
  navGroupTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: space.xs,
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    textTransform: 'uppercase',
  },
  navIconCompact: {
    marginRight: 0,
  },
  navButtonCompact: {
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: space.sm,
  },
  navListCompact: {
    gap: space.xs,
    marginTop: space.lg,
  },
  navRowCompact: {
    justifyContent: 'center',
  },
  navSection: {
    gap: space.xs,
  },
  sidebarCompact: {
    alignItems: 'stretch',
    padding: space.sm,
    width: 72,
  },
  content: {
    backgroundColor: COLORS.bg,
    flex: 1,
    minHeight: 0,
  },
  contentBody: {
    backgroundColor: COLORS.shell,
    flex: 1,
    minHeight: 0,
    // @ts-expect-error web-only
    overflowY: 'auto',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 42,
    marginTop: space.lg,
  },
  logoutLabel: {
    color: colors.dangerSoft,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  navButton: {
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.xs,
    position: 'relative',
    overflow: 'hidden',
    transitionDuration: '300ms',
    transitionProperty: 'background-color',
  },
  navButtonHovered: {
    // handled by gradient
  },
  navButtonActive: {
    // handled by gradient
  },
  navButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.primaryHover})`,
    backgroundRepeat: 'no-repeat',
    transitionDuration: '300ms',
    transitionProperty: 'background-size',
  },
  navIconBadge: {
    marginRight: space.md,
    zIndex: 10,
    transitionDuration: '200ms',
    transitionProperty: 'transform',
  },
  navIconBadgeActive: {
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    zIndex: 10,
    transitionDuration: '300ms',
    transitionProperty: 'color',
  },
  navLabelHovered: {
    color: colors.surface,
  },
  navLabelActive: {
    color: colors.onPrimary, // blue-400
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -12, // half of height 24 to center vertically
    height: 24,
    width: 4,
    backgroundColor: colors.primaryBorder,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 20,
  },
  navList: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    gap: space.sm,
    marginTop: space.xl,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  page: {
    backgroundColor: COLORS.bg,
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  sidebar: {
    backgroundColor: COLORS.nav,
    borderColor: COLORS.navBorder,
    borderRightWidth: 1,
    height: '100%',
    width: 290,
    padding: space.xl,
  },
});
