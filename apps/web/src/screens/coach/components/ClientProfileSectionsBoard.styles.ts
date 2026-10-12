import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  archivedItemSubtitle: { color: colors.textMuted, fontSize: fontSize.xs },
  archivedItemTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  archivedLeft: { alignItems: 'center', flexDirection: 'row', gap: space.md },
  archivedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  board: { gap: space.md },
  chevron: { color: colors.textMuted, fontSize: fontSize.xl, fontWeight: '700' },
  dragHandle: { color: colors.borderStrong, fontSize: fontSize.sm, marginRight: space.sm },
  drawerClose: { color: colors.textMuted, fontSize: fontSize.xl, lineHeight: 24 },
  drawerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  drawerHeaderStart: { alignItems: 'center', flexDirection: 'row', gap: space.md },
  drawerIcon: { color: colors.primaryHover, fontSize: fontSize.sm, fontWeight: '700' },
  drawerIconShell: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  drawerList: { gap: space.md, marginTop: space.lg },
  drawerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  drawerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '800' },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 38,
    justifyContent: 'center',
    marginRight: space.lg,
    width: 38,
  },
  mainList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'visible',
  },
  menuAction: { justifyContent: 'center', minHeight: 32, paddingHorizontal: space.md },
  menuActionLabel: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  menuLabel: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
  rowSubtitle: { color: colors.textMuted, fontSize: fontSize.xs },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
});

export function drawerStyle(visible: boolean): React.CSSProperties {
  return {
    background: colors.surface,
    borderLeft: `1px solid ${colors.border}`,
    borderRadius: '24px 0 0 24px',
    boxShadow: '-12px 0 36px rgba(15,23,42,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100vh',
    maxWidth: '420px',
    padding: '24px 20px',
    position: 'fixed',
    right: 0,
    top: 0,
    transform: visible ? 'translateX(0)' : 'translateX(105%)',
    transition: 'transform 0.25s ease',
    width: 'min(90vw, 420px)',
    zIndex: 30,
  };
}

export const menuStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxShadow: '0 8px 18px rgba(15,23,42,0.12)',
  minWidth: 180,
  position: 'absolute',
  right: 36,
  top: 42,
  zIndex: 10,
};

export const menuStyleTop: React.CSSProperties = {
  ...menuStyle,
  bottom: 42,
  top: 'auto',
};

export const backdropStyle: React.CSSProperties = {
  background: 'rgba(10,18,35,0.42)',
  bottom: 0,
  left: 0,
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 20,
};

export const rowStyle: React.CSSProperties = {
  alignItems: 'center',
  borderBottom: `1px solid ${colors.background}`,
  cursor: 'grab',
  display: 'flex',
  flexDirection: 'row',
  minHeight: 72,
  padding: '10px 14px',
  position: 'relative',
};
