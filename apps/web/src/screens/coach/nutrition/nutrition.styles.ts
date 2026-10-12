import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export const COLORS = {
  accent: colors.primary,
  bg: colors.background,
  border: colors.border,
  card: colors.surface,
  danger: colors.danger,
  muted: colors.textMuted,
  success: colors.success,
  text: colors.text,
};

export const styles = StyleSheet.create({
  actionCircle: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 120,
    justifyContent: 'center',
    marginHorizontal: space.sm,
    width: 120,
  },
  actionCircleLabel: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: space.sm,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    justifyContent: 'center',
    marginVertical: space.xl,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: space.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: space.md,
    padding: space.lg,
  },
  cardMuted: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    marginRight: space.sm,
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
  },
  chipLabel: {
    color: COLORS.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.surface,
  },
  column: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: space.md,
    minHeight: 200,
    minWidth: 200,
    padding: space.md,
  },
  columnTitle: {
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  container: {
    backgroundColor: COLORS.bg,
    flex: 1,
    minHeight: '100%',
    padding: space.xl,
  },
  ctaButton: {
    marginTop: space.md,
  },
  deleteButton: {
    marginTop: space.md,
  },
  fieldLabel: {
    color: COLORS.muted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: space.xs,
  },
  fieldGap: {
    marginBottom: space.md,
  },
  header: {
    marginBottom: space.sm,
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  horizontalScroll: {
    flexDirection: 'row',
    gap: space.md,
    paddingBottom: space.sm,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  listItem: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.sm,
    padding: space.md,
  },
  macroBar: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    flex: 1,
    marginHorizontal: space.xs,
    padding: space.md,
  },
  macroLabel: {
    color: COLORS.muted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: space.md,
  },
  macroValue: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: space.xs,
  },
  searchCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: space.lg,
    padding: space.lg,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: space.sm,
    marginTop: space.lg,
  },
});
