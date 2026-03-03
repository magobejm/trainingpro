import { StyleSheet } from 'react-native';

const COLORS = {
  accent: '#3b82f6',
  bg: '#f8fafc',
  nav: '#ffffff',
  navBorder: '#f1f5f9',
  shell: '#f8fafc',
  textMuted: '#64748b',
  textActive: '#3b82f6',
  textDefault: '#1e293b',
  white: '#ffffff',
};

export const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
  contentBody: {
    backgroundColor: COLORS.shell,
    flex: 1,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    marginTop: 16,
  },
  logoutLabel: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  navButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navButtonActive: {
    backgroundColor: '#eff6ff',
  },
  navIcon: {
    fontSize: 18,
    lineHeight: 20,
    marginRight: 12,
  },
  navIconActive: {
    //
  },
  navIconBadge: {
    // removed badge styling, keeping it flat
  },
  navIconBadgeActive: {
    //
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.textActive,
    fontWeight: '700',
  },
  navList: {
    flex: 1,
    gap: 8,
    marginTop: 40,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    width: 300,
    padding: 32,
  },
});
