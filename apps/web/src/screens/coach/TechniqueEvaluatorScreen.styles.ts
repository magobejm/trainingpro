import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  action: colors.primary,
  bg: colors.background,
  border: colors.border,
  card: colors.surface,
  text: colors.text,
  textMuted: colors.textMuted,
  white: colors.surface,
  danger: colors.danger,
  safe: colors.success,
  warning: colors.warning,
};

export const stylesHtml = {
  dropzone: {
    border: `2px dashed ${COLORS.border}`,
    borderRadius: '16px',
    backgroundColor: colors.surfaceMuted,
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all .2s ease-in-out',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '260px',
  },
  dropzoneActive: {
    borderColor: COLORS.action,
    backgroundColor: colors.primarySoft,
  },
  previewMedia: {
    maxHeight: '240px',
    maxWidth: '100%',
    borderRadius: '8px',
    objectFit: 'contain' as const,
  },
  resultMedia: {
    width: '300px',
    height: '240px',
    borderRadius: '12px',
    objectFit: 'cover' as const,
    backgroundColor: colors.text,
  },
  motionWrapper: {
    marginTop: space.xl,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export const styles = StyleSheet.create({
  page: {
    alignItems: 'stretch',
    backgroundColor: COLORS.bg,
    flexGrow: 1,
    padding: space.xl,
  },
  container: {
    gap: space.md,
    width: '100%',
  },
  hero: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.sm,
    padding: space.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  reviewHint: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.sm,
  },
  failureText: {
    color: COLORS.danger,
    fontSize: fontSize.sm,
    marginTop: space.lg,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    width: '100%',
  },
  dropZoneContent: {
    alignItems: 'center',
    gap: space.sm,
  },
  dropZoneIcon: {
    fontSize: 48,
    marginBottom: space.sm,
  },
  dropZoneTitle: {
    color: COLORS.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  dropZoneHint: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  actionsBox: {
    alignItems: 'center',
    marginTop: space.xl,
  },
  analyzeButton: {
    minWidth: 200,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loaderText: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  loaderSubtext: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.lg,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignSelf: 'flex-start',
    marginTop: space.xs,
  },
  scoreBadgeSafe: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
  },
  scoreBadgeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  scoreBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  scoreBadgeTextSafe: {
    color: colors.success,
  },
  scoreBadgeTextDanger: {
    color: colors.danger,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    padding: space.xl,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    gap: space.xl,
  },
  resultCardDanger: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  errorResetButton: {
    alignSelf: 'center',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: space.xl,
    flexWrap: 'wrap',
  },
  correctionBanner: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.warningSoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: space.xl,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  correctionTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  correctionText: {
    color: colors.warning,
    fontSize: fontSize.lg,
    fontWeight: '500',
    lineHeight: 26,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xl,
    marginTop: space.md,
    backgroundColor: colors.surfaceMuted,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.background,
  },
  detailList: {
    flex: 1,
    minWidth: 250,
    gap: space.md,
  },
  detailTitle: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: fontSize.sm,
    marginBottom: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  pointRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pointLabel: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: fontSize.sm,
  },
  pointValue: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
});
