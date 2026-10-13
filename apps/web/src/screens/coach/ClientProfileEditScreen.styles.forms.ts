import { colors, fontSize, radius, space } from '@trainerpro/ui';
export const formStyles = {
  chip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipLabel: {
    color: colors.primaryHover,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  chipRemove: {
    color: colors.primaryHover,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    minHeight: 38,
    paddingHorizontal: space.md,
  },
  flexInput: {
    flex: 1,
    minWidth: 260,
  },
  actionLabel: {
    color: colors.onPrimary,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: colors.primaryHover,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
} as const;
