import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const dashboardStyles = StyleSheet.create({
  page: { padding: space.xl, gap: space.lg, backgroundColor: colors.background, minHeight: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md, alignItems: 'center' },
  column: { gap: space.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  text: { fontSize: fontSize.sm, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  metric: { fontSize: fontSize.xl, color: colors.text, fontWeight: '800' },
  panel: {
    padding: space.lg,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  tile: { flexBasis: '18%', minWidth: 170, flexGrow: 1 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  active: { color: colors.success, fontWeight: '700', fontSize: fontSize.xs },
  field: { flexBasis: 200, flexGrow: 1 },
  kpi: { flexBasis: 200, flexGrow: 1 },
  chart: { flexBasis: 330, flexGrow: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cycle: { minWidth: 104, flexBasis: '7%', flexGrow: 1, padding: space.sm, gap: space.xs },
  bar: { height: 8, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.success },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
