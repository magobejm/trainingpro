import { StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, radius, space } from '@trainerpro/ui';

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
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceMuted,
    flexGrow: 1,
    padding: space.xl,
  },
  pill: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pillLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  pillValue: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  resultBanner: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
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
    color: colors.text,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  resultText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  rowTitleMuted: {
    color: colors.textMuted,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.primary,
  },
  tabButtonLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  tabButtonLabelActive: {
    color: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
