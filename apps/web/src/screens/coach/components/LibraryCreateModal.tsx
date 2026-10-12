import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, DimensionValue, ScrollView } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIMATION = 'fade' as const;

type Props = {
  cancelLabel: string;
  mediaContent?: React.ReactNode;
  formContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  children?: React.ReactNode; // For backwards compatibility
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  subtitle?: string; // Backwards compat
  visible: boolean;
};

// eslint-disable-next-line max-lines-per-function
export function LibraryCreateModal(props: Props): React.JSX.Element {
  const isTwoColumn = Boolean(props.mediaContent && props.formContent);

  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View style={[styles.card, !isTwoColumn && styles.cardSingleColumn]}>
          {isTwoColumn ? (
            <>
              {/* Left Panel: Media */}
              <View style={styles.leftPanel}>
                <Text style={styles.title}>{props.title}</Text>
                {props.subtitle && <Text style={styles.subtitle}>{props.subtitle}</Text>}
                <View style={styles.mediaContainer}>{props.mediaContent}</View>
              </View>

              {/* Right Panel: Form */}
              <View style={styles.rightPanel}>
                <ScrollView contentContainerStyle={styles.formContainer}>{props.formContent}</ScrollView>

                {props.errorContent}

                <View style={styles.actions}>
                  <Pressable onPress={props.onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelLabel}>{props.cancelLabel}</Text>
                  </Pressable>
                  <Pressable onPress={props.onSubmit} style={styles.submitButton}>
                    <Text style={styles.submitLabel}>{props.isSubmitting ? props.submittingLabel : props.submitLabel}</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            // Single Column Fallback
            <View style={styles.singleColumnPanel}>
              <Text style={styles.title}>{props.title}</Text>
              {props.subtitle && <Text style={styles.subtitle}>{props.subtitle}</Text>}
              <ScrollView contentContainerStyle={styles.formContainer}>{props.children}</ScrollView>

              <View style={styles.actions}>
                <Pressable onPress={props.onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelLabel}>{props.cancelLabel}</Text>
                </Pressable>
                <Pressable onPress={props.onSubmit} style={styles.submitButton}>
                  <Text style={styles.submitLabel}>{props.isSubmitting ? props.submittingLabel : props.submitLabel}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    flexDirection: 'row',
    maxWidth: 1000,
    width: '100%' as DimensionValue,
    maxHeight: '90%' as DimensionValue,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardSingleColumn: {
    maxWidth: 500,
    flexDirection: 'column',
  },
  leftPanel: {
    width: '50%' as DimensionValue,
    backgroundColor: colors.surfaceMuted,
    padding: space.xxxl,
    gap: space.xl,
  },
  rightPanel: {
    width: '50%' as DimensionValue,
    padding: space.xxxl,
    gap: space.xl,
    justifyContent: 'space-between',
  },
  singleColumnPanel: {
    padding: space.xxl,
    gap: space.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: -16,
  },
  mediaContainer: {
    flex: 1,
    gap: space.lg,
  },
  formContainer: {
    gap: space.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'flex-end',
    marginTop: space.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: space.xl,
  },
  cancelLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: space.xl,
  },
  submitLabel: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
