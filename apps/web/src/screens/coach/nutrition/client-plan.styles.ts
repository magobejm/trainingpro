import { StyleSheet } from 'react-native';
import { colors, radius, space } from '@trainerpro/ui';

export const clientPlanStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  muted: { color: colors.textMuted, fontSize: 13 },
  root: { gap: space.lg },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { color: colors.text, fontSize: 16, fontWeight: '800' },
  tile: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexGrow: 1,
    minWidth: 90,
    padding: space.md,
  },
  tileLabel: { color: colors.textMuted, fontSize: 12 },
  tileValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});

export const planContentStyles = StyleSheet.create({
  day: {
    borderLeftColor: colors.primaryBorder,
    borderLeftWidth: 3,
    gap: space.xs,
    marginTop: space.sm,
    paddingLeft: space.md,
  },
  dayLabel: { color: colors.primary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  ingredient: { color: colors.textMuted, fontSize: 13, paddingLeft: space.md },
  meal: { gap: 2, paddingVertical: space.xs },
  mealName: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
