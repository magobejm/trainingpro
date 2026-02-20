import { StyleSheet } from 'react-native';

const COLORS = {
  accent: '#1c74e9',
  bg: '#f6f7f8',
  nav: '#0d121a',
  navBorder: '#1e2a3a',
  shell: '#f6f7f8',
  textMuted: '#9aa5b1',
  white: '#ffffff',
};

export const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.bg,
    flex: 1,
    padding: 16,
  },
  contentBody: {
    backgroundColor: COLORS.shell,
    flex: 1,
    marginTop: 12,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
  },
  logoutLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  navButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navButtonActive: {
    backgroundColor: COLORS.accent,
  },
  navIcon: {
    color: '#e6ecf7',
    fontSize: 13,
    lineHeight: 15,
  },
  navIconActive: {
    color: COLORS.accent,
  },
  navIconBadge: {
    alignItems: 'center',
    backgroundColor: '#1f2a3a',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  navIconBadgeActive: {
    backgroundColor: COLORS.white,
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  navLabelActive: {
    color: COLORS.white,
  },
  navList: {
    flex: 1,
    gap: 8,
    marginTop: 14,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  page: {
    backgroundColor: COLORS.bg,
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: COLORS.nav,
    borderColor: COLORS.navBorder,
    borderRightWidth: 1,
    maxWidth: 290,
    minWidth: 260,
    padding: 16,
  },
});
