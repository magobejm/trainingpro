import { NOTE_ACTION_COL_W } from './warmup-exercise-list.constants';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const md = {
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: space.xl,
  },
  backdrop: {
    ...({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surfaceMuted,
    } as const),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '85vh' as unknown as number,
    maxWidth: 560,
    width: '100%' as const,
    alignSelf: 'center' as const,
    overflow: 'hidden' as const,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '700' as const, color: colors.text, paddingRight: space.sm },
  closeBtn: { padding: space.sm, backgroundColor: colors.background, borderRadius: radius.md },
  closeText: { fontSize: fontSize.sm, color: colors.textMuted },
  body: { maxHeight: '72vh' as unknown as number },
  bodyContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  muted: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18 },
  bodyText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
};

export const el = {
  container: { paddingBottom: space.sm },
  empty: { padding: space.lg },
  emptyText: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' as const },

  row: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: space.md,
    paddingBottom: space.sm,
    paddingHorizontal: space.lg,
  },
  rowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: space.sm,
    marginBottom: space.sm,
  },
  rowName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 18,
  },
  rowActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.xs,
    flexShrink: 0,
  },
  typeBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: fontSize.xs, fontWeight: '700' as const },
  actionBtn: { paddingHorizontal: space.xs, paddingVertical: 2 },
  actionBtnText: { fontSize: fontSize.sm, color: colors.textMuted },

  body: { gap: space.md },
  bodyTopRow: {
    flexDirection: 'row' as const,
    gap: space.md,
    alignItems: 'flex-start' as const,
  },
  mobilityImageCol: {
    flexShrink: 0,
    width: 80,
    gap: space.sm,
  },
  linkUnderImage: { paddingTop: space.xs, alignItems: 'center' as const },
  linkUnderImageText: {
    fontSize: fontSize.xs,
    fontWeight: '500' as const,
    color: colors.primary,
    lineHeight: 14,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  globalChips: {
    flex: 1,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: space.lg,
    alignItems: 'flex-start' as const,
  },
  chipField: { gap: 2 },
  chipLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  chipValue: {
    fontSize: fontSize.xl,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 24,
  },

  setsSection: { gap: space.sm },
  setsTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  tableHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: space.xs,
    marginBottom: 2,
  },
  tableNoteHeaderCell: {
    width: NOTE_ACTION_COL_W,
    flexShrink: 0,
  },
  tableNoteActionCell: {
    width: NOTE_ACTION_COL_W,
    flexShrink: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 2,
  },
  setNoteBtn: {
    padding: space.sm,
    borderRadius: radius.sm,
  },
  setNoteIcon: {
    fontSize: fontSize.md,
    opacity: 0.45,
  },
  setNoteIconActive: {
    opacity: 1,
  },
  tableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  tableCell: {
    width: 90,
    textAlign: 'center' as const,
    paddingHorizontal: space.xs,
  },
  tableCellSerie: { width: 52 },
  tableCellWide: { width: 160, textAlign: 'left' as const },
  tableHeaderWide: { width: 160, textAlign: 'left' as const },
  tableHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  tableCellValue: {
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
    color: colors.text,
  },

  circuitBox: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    marginVertical: space.xs,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    paddingHorizontal: space.sm,
  },
  circuitHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    marginBottom: 2,
  },
  circuitLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700' as const,
    color: colors.primaryHover,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  circuitNote: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontStyle: 'italic' as const,
  },
};
