import { colors, fontSize, radius, space } from '@trainerpro/ui';
export const metricStyles = {
  metricCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    minWidth: 160,
    padding: space.md,
  },
  compactMetricRow: {
    gap: space.xs,
  },
  compactRowPair: {
    flexDirection: 'row',
    gap: space.md,
  },
  compactMetricLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactMetricHalf: {
    flex: 1,
    minWidth: 140,
  },
  compactMetricInput: {
    minHeight: 32,
  },
  compactMetricValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  metricValueLarge: {
    fontSize: fontSize.xxxl,
    lineHeight: 34,
  },
  metricBigValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    lineHeight: 32,
  },
  metricDateValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  metricInput: {
    minHeight: 34,
  },
  metricInputLarge: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    minHeight: 40,
  },
  pencilButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  pencilLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
} as const;
