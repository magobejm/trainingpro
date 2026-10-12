import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  action: colors.primary,
  bg: colors.background,
  card: colors.surface,
  muted: colors.textMuted,
  text: colors.text,
  white: colors.surface,
};

export const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    gap: space.md,
    padding: space.lg,
    width: '100%',
  },
  exerciseCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  label: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: space.md,
    minHeight: '100%',
    padding: space.xl,
  },
  removeExerciseLabel: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  selectedList: {
    gap: space.md,
  },
  templateActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  templateItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: space.md,
  },
  templateList: {
    gap: space.md,
    marginTop: space.sm,
  },
  templateMeta: {
    color: COLORS.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  templateName: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    width: '100%',
  },
});
