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
    maxWidth: 900,
    backgroundColor: MODAL_THEME.colors.background,
    borderRadius: MODAL_THEME.borderRadius.lg,
    maxHeight: '90%',
    display: 'flex',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: MODAL_THEME.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: MODAL_THEME.colors.text,
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
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  leftCol: {
    flex: 1,
    minWidth: 280,
  },
  rightCol: {
    flex: 2,
    minWidth: 320,
  },
  row: {
    flexDirection: 'row',
  },
  fieldSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: MODAL_THEME.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    borderRadius: MODAL_THEME.borderRadius.md,
    padding: 12,
    fontSize: 14,
    color: MODAL_THEME.colors.text,
    backgroundColor: MODAL_THEME.colors.surface,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  mediaHelp: {
    marginTop: 8,
    color: MODAL_THEME.colors.textSecondary,
    fontSize: 14,
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
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: MODAL_THEME.colors.border,
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
