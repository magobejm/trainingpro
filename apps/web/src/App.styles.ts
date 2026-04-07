import { StyleSheet } from 'react-native';

const COLORS = {
  accent: '#3b82f6',
  bg: '#f8fafc',
  nav: '#0f172a',
  navBorder: '#1e293b',
  shell: '#f8fafc',
  textMuted: '#94a3b8',
  textActive: '#e2e8f0',
  textDefault: '#e2e8f0',
  white: '#ffffff',
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
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    marginTop: 16,
  },
  logoutLabel: {
    color: '#fda4af',
    fontSize: 13,
    fontWeight: '600',
  },
  navButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
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
    borderRadius: 12,
    backgroundImage: 'linear-gradient(to right, #2563eb, #ec4899)',
    backgroundRepeat: 'no-repeat',
    transitionDuration: '300ms',
    transitionProperty: 'background-size',
  },
  navIconBadge: {
    marginRight: 12,
    zIndex: 10,
    transitionDuration: '200ms',
    transitionProperty: 'transform',
  },
  navIconBadgeActive: {
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    zIndex: 10,
    transitionDuration: '300ms',
    transitionProperty: 'color',
  },
  navLabelHovered: {
    color: '#ffffff',
  },
  navLabelActive: {
    color: '#60a5fa', // blue-400
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -12, // half of height 24 to center vertically
    height: 24,
    width: 4,
    backgroundColor: '#ec4899', // pink-500 from prototype
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 20,
  },
  navList: {
    flex: 1,
    gap: 8,
    marginTop: 24,
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
    padding: 20,
  },
});
