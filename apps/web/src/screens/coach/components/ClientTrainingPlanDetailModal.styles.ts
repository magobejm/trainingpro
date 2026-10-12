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
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.textMuted,
    borderRadius: radius.md,
    marginTop: space.md,
    paddingVertical: space.md,
  },
  closeText: { color: colors.surface, fontSize: fontSize.md, fontWeight: '600' },
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
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
  },
  planName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '85%',
    maxWidth: 840,
    padding: space.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: space.md,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
