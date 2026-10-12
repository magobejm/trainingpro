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

export const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.bg,
    flex: 1,
    minHeight: 0,
  },
  contentBody: {
    backgroundColor: COLORS.shell,
    flex: 1,
    minHeight: 0,
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
    paddingVertical: space.md,
    marginBottom: space.xs,
    position: 'relative',
    overflow: 'hidden',
    // @ts-expect-error web-only
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
    overflowY: 'auto',
    gap: space.sm,
    marginTop: space.xl,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    width: 290,
    padding: space.xl,
  },
});
