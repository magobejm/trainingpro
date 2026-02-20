import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';

type Props = {
  onClose: () => void;
  onOpenWeeklyReport: () => void;
  onSubmit: (comment: string, isIncomplete: boolean) => void;
  visible: boolean;
};

type BodyProps = {
  comment: string;
  isIncomplete: boolean;
  onClose: () => void;
  onComment: (value: string) => void;
  onOpenWeeklyReport: () => void;
  onSubmit: (comment: string, isIncomplete: boolean) => void;
  onToggle: () => void;
};

type ActionsProps = {
  comment: string;
  isIncomplete: boolean;
  onClose: () => void;
  onOpenWeeklyReport: () => void;
  onSubmit: (comment: string, isIncomplete: boolean) => void;
};

const COLORS = {
  action: '#225fdb',
  bg: 'rgba(12,20,35,0.55)',
  card: '#ffffff',
  text: '#0e1a2f',
  muted: '#5f7288',
  white: '#ffffff',
};

const MODAL_ANIMATION = 'fade' as const;

export function FinishSessionModal(props: Props): React.JSX.Element {
  const [comment, setComment] = useState('');
  const [isIncomplete, setIsIncomplete] = useState(false);
  return (
    <Modal animationType={MODAL_ANIMATION} transparent visible={props.visible}>
      <FinishSessionModalBody
        comment={comment}
        isIncomplete={isIncomplete}
        onClose={props.onClose}
        onComment={setComment}
        onOpenWeeklyReport={props.onOpenWeeklyReport}
        onSubmit={props.onSubmit}
        onToggle={() => setIsIncomplete((value) => !value)}
      />
    </Modal>
  );
}

function FinishSessionModalBody(props: BodyProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('client.finish.title')}</Text>
        <TextInput
          multiline
          onChangeText={props.onComment}
          placeholder={t('client.finish.commentPlaceholder')}
          style={styles.input}
          value={props.comment}
        />
        <Pressable onPress={props.onToggle} style={styles.toggle}>
          <ToggleLabel isIncomplete={props.isIncomplete} />
        </Pressable>
        <ActionButtons
          comment={props.comment}
          isIncomplete={props.isIncomplete}
          onClose={props.onClose}
          onOpenWeeklyReport={props.onOpenWeeklyReport}
          onSubmit={props.onSubmit}
        />
      </View>
    </View>
  );
}

function ToggleLabel(props: { isIncomplete: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Text style={styles.toggleText}>
      {props.isIncomplete ? t('client.finish.incompleteOn') : t('client.finish.incompleteOff')}
    </Text>
  );
}

function ActionButtons(props: ActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Pressable onPress={props.onOpenWeeklyReport} style={styles.ghost}>
        <Text style={styles.ghostLabel}>{t('client.finish.weeklyReport')}</Text>
      </Pressable>
      <Pressable onPress={props.onClose} style={styles.ghost}>
        <Text style={styles.ghostLabel}>{t('client.finish.cancel')}</Text>
      </Pressable>
      <Pressable
        onPress={() => props.onSubmit(props.comment, props.isIncomplete)}
        style={styles.primary}
      >
        <Text style={styles.primaryLabel}>{t('client.finish.submit')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  ghost: {
    alignItems: 'center',
    borderColor: '#d8e1ee',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  ghostLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f3f7fd',
    borderRadius: 10,
    minHeight: 84,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  primaryLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  toggle: {
    paddingVertical: 4,
  },
  toggleText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
