import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  empty: {
    color: '#5d6f85',
    fontSize: 13,
  },
  filtersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  objectiveFilter: {
    backgroundColor: '#ffffff',
    borderColor: '#e3eaf5',
    borderRadius: 10,
    borderWidth: 1,
    color: '#4a5568',
    fontSize: 13,
    fontWeight: '600',
    height: 38,
    minWidth: 320,
    outlineColor: '#1c74e9',
    paddingHorizontal: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#e3eaf5',
    borderRadius: 10,
    borderWidth: 1,
    color: '#475569',
    fontSize: 13,
    minWidth: 340,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
  },
});
