import { StyleSheet } from 'react-native';

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  input: '#f3f7fd',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  deleteAction: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteActionLabel: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  editAction: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editActionLabel: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  exerciseCard: {
    borderColor: '#dce5f2',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 24,
  },
  removeExerciseBtn: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  removeExerciseLabel: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },
  selectedList: {
    gap: 10,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    width: '100%',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 12,
  },
  templateList: {
    gap: 12,
    marginTop: 8,
  },
  templateMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  templateName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
});
