export const layoutStyles = {
  page: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dde6f2',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainColumn: {
    flex: 1.7,
    gap: 12,
    minWidth: 520,
  },
  sideColumn: {
    flex: 1,
    gap: 12,
    minWidth: 280,
  },
  splitCard: {
    flex: 1,
    minWidth: 280,
  },
  title: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
  },
  statsCard: {
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topFramesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  frameCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe7f5',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  multiMetricsFrame: {
    gap: 8,
    minWidth: 360,
  },
  weightFrame: {
    justifyContent: 'flex-start',
    minWidth: 150,
  },
  ageFrame: {
    gap: 6,
    minWidth: 280,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  activeSinceText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  avatarColumn: {
    gap: 8,
    width: 260,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  blockIcon: {
    fontSize: 14,
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
} as const;
