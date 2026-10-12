import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const s = StyleSheet.create({
  body: {
    gap: space.lg,
    flex: 1,
  },
  bodyColumn: {
    flexDirection: 'column',
  },
  bodyRow: {
    flexDirection: 'row',
  },
  typeBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  typeBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  typeBtnActive: {
    backgroundColor: colors.primaryBorder,
    borderColor: colors.primaryBorder,
  },
  typeBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: colors.primaryHover,
  },
  footerCount: {
    color: colors.textMuted,
    flex: 1,
    fontSize: fontSize.sm,
  },
  cardAddedBadge: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
  },
  cardAction: { flex: 1 },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  cardBody: {
    padding: space.md,
  },
  cardGrid: {
    gap: space.md,
    paddingBottom: space.md,
  },
  cardImage: {
    height: 120,
    width: '100%',
  },
  cardImageFrame: {
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: space.sm,
  },
  cardRow: {
    gap: space.md,
  },
  cardSubtitle: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 16, marginTop: space.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  detailColumn: {
    flex: 1,
    minWidth: 260,
  },
  detailEmpty: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    minHeight: 200,
    padding: space.lg,
  },
  detailEmptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  detailPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailMediaWrapper: {
    height: 240,
    width: '100%',
    backgroundColor: colors.surfaceInverse,
  },
  detailContent: {
    padding: space.xl,
    gap: space.lg,
  },
  detailSection: {
    gap: space.sm,
  },
  detailTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  list: { flex: 1, overflow: 'hidden' },
  listColumn: {
    flex: 2,
    minWidth: 280,
    flexBasis: 0,
  },
  loader: { marginTop: space.xl },
  sheet: {
    gap: space.sm,
    height: '60vh' as unknown as number,
  },
});
