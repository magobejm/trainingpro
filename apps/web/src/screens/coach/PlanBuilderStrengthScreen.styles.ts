import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  action: colors.primary,
  bg: colors.background,
  card: colors.surface,
  input: colors.background,
  muted: colors.textMuted,
  text: colors.text,
  white: colors.surface,
};

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: space.xl,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    gap: space.md,
    padding: space.lg,
    width: '100%',
  },
  deleteAction: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  deleteActionLabel: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  editAction: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  editActionLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  empty: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
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
  input: {
    backgroundColor: COLORS.input,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
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
  removeExerciseBtn: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  removeExerciseLabel: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginTop: -2,
  },
  selectedList: {
    gap: space.md,
  },
  successBanner: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
    width: '100%',
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
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
