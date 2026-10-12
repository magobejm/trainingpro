import { StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radius, space } from '@trainerpro/ui';

export const COLORS = {
  accent: colors.primary,
  border: colors.border,
  card: colors.surface,
  page: colors.surfaceMuted,
  success: colors.success,
  successBg: colors.successSoft,
  text: colors.text,
  textMuted: colors.textMuted,
  warning: colors.danger,
};

export const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  avatarLabelMuted: {
    color: COLORS.textMuted,
  },
  avatarMuted: {
    backgroundColor: colors.background,
  },
  container: {
    gap: space.lg,
    maxWidth: 980,
    width: '100%',
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
  },
  hero: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.sm,
    padding: space.lg,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTitles: {
    flex: 1,
    gap: 2,
    paddingRight: space.md,
  },
  list: {
    gap: space.md,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flexGrow: 1,
    padding: space.xl,
  },
  pill: {
    backgroundColor: colors.background,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pillLabel: {
    color: COLORS.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  pillValue: {
    color: COLORS.text,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  resultBanner: {
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: 24,
    flexDirection: 'row',
    left: 24,
    padding: space.md,
    position: 'absolute',
    right: 24,
  },
  resultClose: {
    marginLeft: space.sm,
  },
  resultContent: {
    flex: 1,
    gap: space.xs,
  },
  resultPassword: {
    color: COLORS.text,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  resultText: {
    color: COLORS.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  row: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.lg,
  },
  rowActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  rowArchived: {
    opacity: 0.75,
  },
  rowIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.md,
  },
  rowStatus: {
    color: COLORS.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  rowTitleMuted: {
    color: COLORS.textMuted,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  tabBar: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    padding: space.xs,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: space.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accent,
  },
  tabButtonLabel: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  tabButtonLabelActive: {
    color: colors.surface,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
