import { StyleSheet, type ViewStyle } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const fixedBar = {
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderColor: colors.borderStrong,
  borderRadius: radius.lg,
  borderWidth: 1,
  bottom: space.lg,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: space.sm,
  left: '50%',
  maxWidth: '96%',
  padding: space.md,
  position: 'fixed',
  transform: [{ translateX: '-50%' }],
  zIndex: 50,
} as unknown as ViewStyle;

export const bulkStyles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bar: fixedBar,
  barCount: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  body: { gap: space.md },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  summary: { gap: space.sm },
  summaryHead: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  summaryList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  summaryName: { color: colors.text, flexShrink: 1, fontSize: fontSize.sm },
  summaryNote: { color: colors.textMuted, fontSize: fontSize.xs },
  summaryText: { flexShrink: 1 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  toolbar: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
});
