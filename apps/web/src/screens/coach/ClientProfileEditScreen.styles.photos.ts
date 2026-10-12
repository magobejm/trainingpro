import { colors, fontSize, radius, space } from '@trainerpro/ui';
export const photoStyles = {
  photoCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.sm,
    width: 150,
  },
  photoDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  photoThumbButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 15, 30, 0.4)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  photoOverlayIcon: {
    color: colors.surface,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  archivedPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.sm,
    marginTop: space.sm,
    padding: space.md,
  },
  archivedList: {
    gap: space.sm,
  },
  archivedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  archivedLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  archivedThumb: {
    borderRadius: radius.md,
    height: 44,
    width: 44,
  },
  archivedTitle: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  archivedSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
} as const;
