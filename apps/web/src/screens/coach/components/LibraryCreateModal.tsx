import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, DimensionValue, ScrollView } from 'react-native';

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
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onClose}
      transparent
      visible={props.visible}
    >
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
                <ScrollView contentContainerStyle={styles.formContainer}>
                  {props.formContent}
                </ScrollView>

                {props.errorContent}

                <View style={styles.actions}>
                  <Pressable onPress={props.onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelLabel}>{props.cancelLabel}</Text>
                  </Pressable>
                  <Pressable onPress={props.onSubmit} style={styles.submitButton}>
                    <Text style={styles.submitLabel}>
                      {props.isSubmitting ? props.submittingLabel : props.submitLabel}
                    </Text>
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
                  <Text style={styles.submitLabel}>
                    {props.isSubmitting ? props.submittingLabel : props.submitLabel}
                  </Text>
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
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    flexDirection: 'row',
    maxWidth: 1000,
    width: '100%' as DimensionValue,
    maxHeight: '90%' as DimensionValue,
    overflow: 'hidden',
    shadowColor: '#000',
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
    backgroundColor: '#f8fafc',
    padding: 40,
    gap: 24,
  },
  rightPanel: {
    width: '50%' as DimensionValue,
    padding: 40,
    gap: 24,
    justifyContent: 'space-between',
  },
  singleColumnPanel: {
    padding: 32,
    gap: 24,
  },
  title: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: -16,
  },
  mediaContainer: {
    flex: 1,
    gap: 16,
  },
  formContainer: {
    gap: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
  },
  cancelLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
  },
  submitLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
