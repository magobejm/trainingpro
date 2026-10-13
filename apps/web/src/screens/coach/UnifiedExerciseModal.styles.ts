import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.xl,
    marginBottom: space.xl,
  },
  gridColLeft: {
    flex: 1.2,
    minWidth: 280,
  },
  gridColRight: {
    flex: 2.2,
    minWidth: 400,
  },
  row: {
    flexDirection: 'row',
  },
  fieldSection: {
    marginBottom: space.lg,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  mediaBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  mediaUploadIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  mediaUploadTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  mediaHelp: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.text,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaPreviewBlur: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.7,
  },
  mediaPreviewContain: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    marginBottom: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  videoPreviewWrapper: {
    // Match mediaBox margin
  },
  videoPreview: {
    height: 180, // Same as mediaBox
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.text,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--tp-imageOverlaySoft)',
  },
  biomechBlock: {
    // Left empty or removed border since it's a card now
  },
});
