import { StyleSheet } from 'react-native';
import { MODAL_THEME } from './UnifiedExerciseModal.types';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 16, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as object,
  modalContainer: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: colors.surfaceMuted, // Light gray background for the overall modal
    borderRadius: MODAL_THEME.borderRadius.lg,
    maxHeight: '90%',
    display: 'flex',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
    marginLeft: space.lg,
  },
  closeBtn: {
    padding: space.xs,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: space.xl,
  },
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
  input: {
    borderWidth: 0,
    borderRadius: MODAL_THEME.borderRadius.md,
    padding: space.lg,
    fontSize: fontSize.md,
    fontWeight: '500',
    color: MODAL_THEME.colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  textArea: {
    minHeight: 320,
    textAlignVertical: 'top',
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  mediaBox: {
    borderWidth: 2,
    borderColor: MODAL_THEME.colors.border,
    borderStyle: 'dashed',
    borderRadius: MODAL_THEME.borderRadius.md,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MODAL_THEME.colors.surface,
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
    color: MODAL_THEME.colors.text,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.dangerSoft,
    paddingHorizontal: space.xl,
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
  errorClose: {
    padding: space.xs,
  },
  videoPreviewWrapper: {
    // Match mediaBox margin
  },
  videoPreview: {
    height: 180, // Same as mediaBox
    borderRadius: MODAL_THEME.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.text,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  biomechBlock: {
    // Left empty or removed border since it's a card now
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
    marginBottom: space.lg,
  },
  footer: {
    padding: space.xl,
    borderTopWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.md,
    backgroundColor: colors.surface,
  },
  btnBase: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  btnPrimary: {
    backgroundColor: MODAL_THEME.colors.primary,
  },
  btnOutline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  btnTextPrimary: {
    color: colors.surface,
  },
  btnTextOutline: {
    color: colors.text,
  },
});
