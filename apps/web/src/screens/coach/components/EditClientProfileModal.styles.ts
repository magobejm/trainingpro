import type { CSSProperties } from 'react';
import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  archiveBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: space.sm,
    padding: space.md,
  },
  archiveText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
    flex: 1,
    marginRight: space.md,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
  },
  avatarButton: {
    flex: 1,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginBottom: space.md,
    width: 76,
  },
  avatarFallbackLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  avatarImage: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 76,
    marginBottom: space.md,
    width: 76,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  field: {
    gap: space.xs,
  },
  form: {
    gap: space.md,
  },
  resetBox: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: space.sm,
    padding: space.md,
  },
  resetPasswordValue: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '800',
    marginTop: space.sm,
  },
  resetText: {
    color: colors.success,
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginRight: space.md,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.md,
  },
});

export const selectStyle: CSSProperties = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxSizing: 'border-box',
  color: colors.text,
  minHeight: 38,
  padding: '8px 12px',
  paddingRight: space.xxl,
  width: '100%',
};
