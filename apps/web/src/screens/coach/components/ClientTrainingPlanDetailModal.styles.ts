import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  blockGroup: {
    gap: space.sm,
  },
  blockGroupTitle: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  blockMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  blockName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  blockRow: {
    gap: space.xs,
  },
  body: {
    gap: space.lg,
  },
  dayCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.md,
  },
  dayTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  planName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  value: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
