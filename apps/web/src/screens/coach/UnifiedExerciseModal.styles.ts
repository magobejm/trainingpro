import { StyleSheet } from 'react-native';
import { MODAL_THEME } from './UnifiedExerciseModal.types';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 16, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as object,
  modalContainer: {
    width: '100%',
    maxWidth: 1000,
    backgroundColor: '#f5f7fa', // Light gray background for the overall modal
    borderRadius: MODAL_THEME.borderRadius.lg,
    maxHeight: '90%',
    display: 'flex',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
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
    fontSize: 22,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
    marginLeft: 16,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 24,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8b9bb4',
    marginBottom: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: MODAL_THEME.borderRadius.md,
    padding: 16,
    fontSize: 15,
    fontWeight: '500',
    color: MODAL_THEME.colors.text,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 320,
    textAlignVertical: 'top',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#eef3fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaUploadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
    marginBottom: 6,
  },
  mediaHelp: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorClose: {
    padding: 4,
  },
  videoPreviewWrapper: {
    // Match mediaBox margin
  },
  videoPreview: {
    height: 180, // Same as mediaBox
    borderRadius: MODAL_THEME.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
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
    fontSize: 16,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
    marginBottom: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  btnBase: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  btnPrimary: {
    backgroundColor: MODAL_THEME.colors.primary,
  },
  btnOutline: {
    backgroundColor: '#eef3fb',
    borderWidth: 1,
    borderColor: '#d7e1f1',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnTextPrimary: {
    color: '#ffffff',
  },
  btnTextOutline: {
    color: '#2a466e',
  },
});
