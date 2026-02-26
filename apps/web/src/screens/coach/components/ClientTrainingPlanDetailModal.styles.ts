import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  blockGroup: {
    gap: 6,
  },
  blockGroupTitle: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  blockMeta: {
    color: '#6b7280',
    fontSize: 12,
  },
  blockName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  blockRow: {
    gap: 4,
  },
  body: {
    gap: 16,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: '#64748b',
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  closeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dayCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  dayTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  planName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '85%',
    maxWidth: 840,
    padding: 20,
    width: '100%',
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  value: {
    color: '#1e293b',
    fontSize: 13,
    lineHeight: 18,
  },
});
