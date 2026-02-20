import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderColor: '#cfdced',
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelLabel: {
    color: '#334e70',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce6f3',
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    maxWidth: 420,
    padding: 18,
    width: '92%',
  },
  confirmButton: {
    backgroundColor: '#d92d20',
    borderRadius: 10,
    minWidth: 130,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#4f6079',
    fontSize: 14,
    lineHeight: 20,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(12, 24, 45, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    color: '#0e1a2f',
    fontSize: 17,
    fontWeight: '800',
  },
});
