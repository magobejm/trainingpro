import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  page: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  successBanner: { backgroundColor: '#dcfce7', borderRadius: 8, padding: 12 },
  successText: { color: '#166534', fontWeight: '600', textAlign: 'center' },

  // Day tabs
  dayTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  dayTabActive: { backgroundColor: '#3b82f6' },
  dayTabText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  dayTabTextActive: { color: '#fff' },
  addDayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  addDayText: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },

  // Day header
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteDayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteDayText: { fontSize: 12, color: '#dc2626', fontWeight: '500' },

  // Block card
  blockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dragHandle: { fontSize: 20, color: '#94a3b8', paddingRight: 4 },
  blockName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  blockTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  blockTagText: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'capitalize' },
  blockActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewDetailBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  viewDetailBtnText: { fontSize: 14 },
  moveBtn: { padding: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  moveBtnText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  removeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fee2e2' },
  removeBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  blockFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Number field
  numberField: { gap: 4, minWidth: 80 },
  numberLabel: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 6,
    fontSize: 13,
    width: 80,
    textAlign: 'center',
  },

  // Add block
  addBlockBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
  },
  addBlockText: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  blockTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blockTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  blockTypeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Save
  saveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Template list
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  templateName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  templateMeta: { fontSize: 12, color: '#94a3b8' },
  templateBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#94a3b8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  templateBadgeGlobal: { backgroundColor: '#f59e0b' },
  templateActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  editBtnText: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '500' },

  // Empty
  emptyDay: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: 12 },

  // Plan 72
  readOnlyBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  readOnlyText: { color: '#64748b', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
});
