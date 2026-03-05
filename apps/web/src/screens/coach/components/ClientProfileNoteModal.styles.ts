import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    gap: 12,
    maxWidth: 560,
    padding: 18,
    width: '100%',
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#617085',
    fontSize: 13,
  },
  input: {
    borderColor: '#dce5f2',
    borderRadius: 10,
    borderWidth: 1,
    color: '#1f2d3f',
    fontSize: 14,
    minHeight: 120,
    padding: 12,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  btn: {
    borderRadius: 10,
    minHeight: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#f3f6fb',
    borderColor: '#d7e2f1',
    borderWidth: 1,
  },
  btnDelete: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  btnSave: {
    backgroundColor: '#1c74e9',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  textCancel: {
    color: '#314c73',
    fontSize: 12,
    fontWeight: '800',
  },
  textDelete: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
  },
  textSave: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
