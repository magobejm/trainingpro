import { StyleSheet } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';

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
    flexBasis: 200,
    flexGrow: 1,
    minWidth: 160,
  },
  searchInput: {
    flexBasis: 200,
    flexGrow: 1,
    minWidth: 160,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: '800',
  },
});
