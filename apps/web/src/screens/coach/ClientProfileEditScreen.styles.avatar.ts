import { colors, fontSize, radius, space } from '@trainerpro/ui';
export const avatarStyles = {
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.border,
    borderRadius: 44,
    borderWidth: 1,
    overflow: 'hidden',
    padding: space.xs,
    position: 'relative',
  },
  avatarOverlay: {
    alignItems: 'center',
    backgroundColor: 'var(--tp-overlay)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  avatarOverlayPlus: {
    color: colors.onPrimary,
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    lineHeight: 38,
  },
  avatarOption: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 2,
  },
  avatarOptionActive: {
    borderColor: colors.primary,
  },
  avatarOptionImage: {
    borderRadius: radius.md,
    height: 44,
    width: 44,
  },
} as const;
