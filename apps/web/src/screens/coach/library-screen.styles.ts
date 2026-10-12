import { StyleSheet, DimensionValue } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  bg: colors.surfaceMuted,
  card: colors.surface,
  muted: colors.textMuted,
  text: colors.text,
};

export const libraryStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: space.xxxl,
    gap: space.xxl,
  },
  filtersWrapper: {
    flexDirection: 'row',
    width: '100%' as DimensionValue,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    gap: space.md,
    padding: space.lg,
    width: '100%' as DimensionValue,
  },
  empty: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    padding: space.xxxl,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
    width: '100%' as DimensionValue,
  },
  list: {
    gap: space.md,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    width: '100%' as DimensionValue,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    width: '100%' as DimensionValue,
  },
});
