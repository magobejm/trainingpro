import { colors, fontSize, radius, space } from '@trainerpro/ui';
export const layoutStyles = {
  page: {
    gap: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  mainLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  mainColumn: {
    flex: 1.7,
    gap: space.md,
    minWidth: 520,
  },
  sideColumn: {
    flex: 1,
    gap: space.md,
    minWidth: 280,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  topFramesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.sm,
  },
  frameCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
  },
  multiMetricsFrame: {
    gap: space.sm,
    minWidth: 360,
  },
  weightFrame: {
    justifyContent: 'flex-start',
    minWidth: 150,
  },
  ageFrame: {
    gap: space.sm,
    minWidth: 280,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  activeSinceText: {
    color: colors.primaryHover,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: space.lg,
  },
  headerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  headerRowStacked: {
    flexDirection: 'column',
  },
  avatarColumnStacked: {
    alignSelf: 'stretch',
    width: 'auto',
  },
  stackedColumn: {
    flexBasis: '100%',
    minWidth: 0,
  },
  stackedFrame: {
    flexBasis: '100%',
    minWidth: 0,
  },
  avatarColumn: {
    gap: space.sm,
    width: 260,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  blockIcon: {
    fontSize: fontSize.sm,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
} as const;
