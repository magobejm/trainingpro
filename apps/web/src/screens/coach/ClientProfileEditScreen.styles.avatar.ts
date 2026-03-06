export const avatarStyles = {
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#dbe7f5',
    borderRadius: 44,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 4,
    position: 'relative',
  },
  avatarOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 18, 33, 0.4)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  avatarOverlayPlus: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 38,
  },
  headerAvatar: {
    borderRadius: 40,
    height: 180,
    width: 180,
  },
  avatarCarousel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    borderColor: '#dbe7f5',
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
  },
  avatarOptionActive: {
    borderColor: '#1c74e9',
  },
  avatarOptionImage: {
    borderRadius: 10,
    height: 44,
    width: 44,
  },
} as const;
