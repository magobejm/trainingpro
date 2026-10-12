import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 110,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  cancelLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.lg,
    maxWidth: 420,
    padding: space.lg,
    width: '92%',
  },
  confirmButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    minWidth: 130,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  confirmLabel: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 24, 45, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
});
