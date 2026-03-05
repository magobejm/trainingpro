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
  },
  contentBody: {
    backgroundColor: COLORS.shell,
    flex: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navButtonActive: {
    backgroundColor: '#2563eb',
  },
  navIcon: {
    fontSize: 18,
    lineHeight: 20,
    marginRight: 12,
  },
  navIconActive: {
    color: '#ffffff',
  },
  navIconBadge: {
    // removed badge styling, keeping it flat
  },
  navIconBadgeActive: {
    //
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
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
  },
  sidebar: {
    backgroundColor: COLORS.nav,
    borderColor: COLORS.navBorder,
    borderRightWidth: 1,
    width: 290,
    padding: 20,
  },
});
