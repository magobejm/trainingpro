import { StyleSheet } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  compactAvatar: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  modalBody: {
    gap: space.md,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    width: '100%',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceInverse,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarEditor: {
    alignItems: 'center',
    gap: space.sm,
  },
  avatarLarge: {
    borderRadius: 999,
    height: 72,
    width: 72,
  },
  card: {
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.text,
    borderRadius: 20,
    borderWidth: 1,
    padding: space.xl,
    width: '100%',
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  fields: {
    gap: space.sm,
  },
  gearIcon: {
    color: colors.borderStrong,
    fontSize: fontSize.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.surfaceMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
