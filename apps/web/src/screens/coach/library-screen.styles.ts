import { StyleSheet, DimensionValue } from 'react-native';

const COLORS = {
  bg: '#F8FAFC',
  card: '#ffffff',
  muted: '#64748B',
  text: '#1E293B',
};

export const libraryStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 40,
    gap: 32,
  },
  filtersWrapper: {
    flexDirection: 'row',
    width: '100%' as DimensionValue,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 12,
    padding: 14,
    width: '100%' as DimensionValue,
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
    padding: 40,
    textAlign: 'center',
  },
  error: {
    color: '#b42318',
    fontSize: 12,
    fontWeight: '700',
    width: '100%' as DimensionValue,
  },
  list: {
    gap: 10,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%' as DimensionValue,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%' as DimensionValue,
  },
});
