import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  filtersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  headerRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'space-between',
    paddingRight: space.sm,
  },
  objectiveFilter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    flexBasis: 200,
    flexGrow: 1,
    height: 38,
    minWidth: 160,
    outlineColor: colors.primary,
    paddingHorizontal: space.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textMuted,
    flexBasis: 200,
    flexGrow: 1,
    fontSize: fontSize.sm,
    minWidth: 160,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: '800',
  },
});
