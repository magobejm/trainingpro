export const photoStyles = {
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe7f5',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 8,
    width: 150,
  },
  photoImage: {
    borderRadius: 8,
    height: 120,
    width: '100%',
  },
  photoDate: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  photoThumbButton: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 15, 30, 0.4)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  photoOverlayIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  archivedPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5f2',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 12,
  },
  archivedList: {
    gap: 8,
  },
  archivedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  archivedLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  archivedThumb: {
    borderRadius: 8,
    height: 44,
    width: 44,
  },
  archivedTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  archivedSubtitle: {
    color: '#64748b',
    fontSize: 11,
  },
} as const;
