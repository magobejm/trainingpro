import { StyleSheet } from 'react-native';

const COLORS = {
  bg: '#edf3fb',
  card: '#ffffff',
  muted: '#627285',
  text: '#0e1a2f',
};

export const libraryStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 12,
    padding: 14,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  error: {
    color: '#b42318',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 24,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
});
