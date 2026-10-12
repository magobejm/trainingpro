import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: space.md,
    maxWidth: 560,
    padding: space.lg,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  input: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    minHeight: 120,
    padding: space.md,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    justifyContent: 'flex-end',
  },
  btn: {
    borderRadius: radius.md,
    minHeight: 38,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  btnDelete: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
    borderWidth: 1,
  },
  btnSave: {
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  textCancel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  textDelete: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  textSave: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
});
