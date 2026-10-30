import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCreateClientNoteMutation, type FeedbackCategory } from '../../data/hooks/useClientNotes';
import { useCreateIncidentMutation } from '../../data/hooks/useIncidents';
import { showError, showToast } from '../../shell/client/feedback';
import { ConfirmModal } from '../../theme/ConfirmModal';
import { LIGHT } from '../../theme/light';
import { useOptionalCoachNotice } from './MorningCheckinGate';
import { useChatVideoUpload, type PickedChatVideo } from '../../features/chat/useChatVideoUpload';
import { VideoAttachment } from '../../features/chat/VideoAttachment';
import { commentNotice, incidentNotice, incidentSeverityForCategory, linkTo, noteInput } from './exercise-comment.utils';
import { FeedbackCategoryPicker } from './FeedbackCategoryPicker';
import { canSubmitFeedback } from './feedback-category.utils';
import type { IncidentCategory } from './incident-notice.utils';

type ExerciseCommentModalProps = {
  exerciseLibraryId?: null | string;
  exerciseName: string;
  routineDayLabel: string;
  sessionId: string;
  sessionItemId?: null | string;
  visible: boolean;
  onClose: () => void;
};

const CATEGORIES: IncidentCategory[] = ['molestia', 'dolor', 'lesion', 'otro'];

const CATEGORY_TONE: Record<IncidentCategory, { bg: string; border: string; text: string }> = {
  dolor: { bg: '#c2410c', border: '#c2410c', text: '#ffffff' },
  lesion: { bg: '#dc2626', border: '#dc2626', text: '#ffffff' },
  molestia: { bg: '#7c3aed', border: '#7c3aed', text: '#ffffff' },
  otro: { bg: '#d97706', border: '#d97706', text: '#ffffff' },
};

export function ExerciseCommentModal(props: ExerciseCommentModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const vm = useExerciseCommentViewModel(props);

  return (
    <Modal animationType={'fade'} onRequestClose={vm.close} transparent visible={props.visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={vm.close} style={styles.backBtn}>
              <Text style={styles.backArrow}>{'←'}</Text>
            </Pressable>
            <Text style={styles.title}>{t('mobile.client.comment.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.hint}>{t('mobile.client.comment.hint')}</Text>
            <FeedbackCategoryPicker onChange={vm.setScope} value={vm.scope} />
            <TextInput
              multiline
              onChangeText={vm.setCommentText}
              placeholder={t('mobile.client.comment.placeholder')}
              placeholderTextColor={LIGHT.accentMuted}
              style={[styles.textarea, vm.showIncident ? styles.textareaCompact : null]}
              value={vm.commentText}
            />
            <VideoAttachSection vm={vm} />
            <Pressable
              disabled={!canSubmitFeedback(vm.scope, vm.commentText) || vm.isSubmitting}
              onPress={() => {
                void vm.handleSaveComment();
              }}
              style={[styles.saveCommentBtn, !canSubmitFeedback(vm.scope, vm.commentText) ? styles.btnDisabled : null]}
            >
              <Text style={styles.saveCommentText}>{`✈  ${t('mobile.client.comment.save')}`}</Text>
            </Pressable>
            <View style={styles.incidentToggleRow}>
              <Text style={styles.incidentQuestion}>{t('mobile.client.comment.incidentsQuestion')}</Text>
              <Pressable
                onPress={() => vm.setShowIncident((open) => !open)}
                style={vm.showIncident ? styles.cancelIncidentBtn : styles.openIncidentBtn}
              >
                <Text style={vm.showIncident ? styles.cancelIncidentText : styles.openIncidentText}>
                  {vm.showIncident
                    ? `ⓘ  ${t('mobile.client.comment.cancelIncident')}`
                    : `ⓘ  ${t('mobile.client.comment.openIncident')}`}
                </Text>
              </Pressable>
            </View>
            {vm.showIncident ? (
              <IncidentRegisterCard
                category={vm.category}
                canSend={vm.scope !== null}
                isSubmitting={vm.isSubmitting}
                text={vm.incidentText}
                onChangeText={vm.setIncidentText}
                onSave={() => {
                  void vm.saveIncident(false);
                }}
                onSaveAndReport={() => vm.setConfirmReport(true)}
                onSelectCategory={vm.setCategory}
              />
            ) : null}
          </ScrollView>
        </View>
        <ConfirmModal
          cancelLabel={t('mobile.client.comment.reportCancel')}
          confirmLabel={t('mobile.client.comment.reportConfirm')}
          confirmTone={'danger'}
          message={t('mobile.client.comment.reportMessage')}
          onCancel={() => vm.setConfirmReport(false)}
          onConfirm={() => {
            vm.setConfirmReport(false);
            void vm.saveIncident(true);
          }}
          title={t('mobile.client.comment.reportTitle')}
          visible={vm.confirmReport}
        />
      </View>
    </Modal>
  );
}

async function applyPickedVideo(
  picked: ReturnType<ReturnType<typeof useChatVideoUpload>['pick']>,
  setVideo: (video: PickedChatVideo | null) => void,
  report: (key: string) => void,
): Promise<void> {
  const result = await picked;
  if (result.error) {
    report(`mobile.client.comment.video.error.${result.error}`);
    return;
  }
  if (result.video) setVideo(result.video);
}

function useExerciseCommentViewModel(props: ExerciseCommentModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreateIncidentMutation();
  const noteMutation = useCreateClientNoteMutation();
  const notifyCoach = useOptionalCoachNotice();
  const [commentText, setCommentText] = useState('');
  const [scope, setScope] = useState<FeedbackCategory | null>(null);
  const [incidentText, setIncidentText] = useState('');
  const [showIncident, setShowIncident] = useState(false);
  const [category, setCategory] = useState<IncidentCategory>('molestia');
  const [confirmReport, setConfirmReport] = useState(false);
  const [video, setVideo] = useState<PickedChatVideo | null>(null);
  const videoUpload = useChatVideoUpload();

  useEffect(() => {
    if (props.visible) {
      setVideo(null);
      setCommentText('');
      setScope(null);
      setIncidentText('');
      setShowIncident(false);
      setCategory('molestia');
      setConfirmReport(false);
    }
  }, [props.visible]);

  const close = () => {
    setConfirmReport(false);
    props.onClose();
  };

  const handleSaveComment = async () => {
    const comment = commentText.trim();
    if (!comment || !scope) {
      return;
    }
    try {
      await noteMutation.mutateAsync(noteInput(props, scope, comment));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('mobile.client.comment.saveError'));
      return;
    }
    await notifyCoach(commentNotice(props, comment), video ? [video.draft] : undefined);

    showToast(t('mobile.client.comment.saved'));
    close();
  };

  const saveIncident = async (reportToChat: boolean) => {
    const description = incidentText.trim();
    if (!description || !scope) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...linkTo(props),
        category: scope,
        description,
        severity: incidentSeverityForCategory(category),
        tag: category,
      });

      if (reportToChat) {
        await notifyCoach(
          incidentNotice(props, t(`mobile.client.comment.category.${category}`), description),
          video ? [video.draft] : undefined,
        );

        showToast(t('mobile.client.comment.incidentReported'));
      } else {
        showToast(t('mobile.client.comment.incidentSaved'));
      }
      close();
    } catch (error) {
      showError(error instanceof Error ? error.message : t('mobile.client.comment.saveError'));
    }
  };

  return {
    category,
    close,
    commentText,
    confirmReport,
    handleSaveComment,
    incidentText,
    isSubmitting: createMutation.isPending || noteMutation.isPending,
    pickVideo: (source: 'camera' | 'library') =>
      applyPickedVideo(videoUpload.pick(source), setVideo, (key) => showError(t(key))),
    removeVideo: () => setVideo(null),
    saveIncident,
    scope,
    setCategory,
    setCommentText,
    setConfirmReport,
    setIncidentText,
    setScope,
    setShowIncident,
    showIncident,
    video,
    videoPending: videoUpload.pending,
    videoReady: videoUpload.ready,
  };
}

function VideoAttachSection(props: { vm: ReturnType<typeof useExerciseCommentViewModel> }): React.JSX.Element {
  const { t } = useTranslation();
  const { vm } = props;
  if (vm.videoPending) {
    return (
      <View style={styles.videoBox}>
        <ActivityIndicator color={LIGHT.accent} />
        <Text style={styles.videoHint}>{t('mobile.client.comment.video.uploading')}</Text>
      </View>
    );
  }
  if (vm.video) {
    return (
      <View style={styles.videoBox}>
        <VideoAttachment uri={vm.video.localUri} />
        <Pressable accessibilityRole="button" onPress={vm.removeVideo} style={styles.videoBtn}>
          <Text style={styles.videoBtnText}>{t('mobile.client.comment.video.remove')}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.videoBox}>
      <Text style={styles.videoHint}>{t('mobile.client.comment.video.hint')}</Text>
      <View style={styles.videoRow}>
        {Platform.OS === 'web' ? null : (
          <Pressable
            accessibilityRole="button"
            disabled={!vm.videoReady}
            onPress={() => void vm.pickVideo('camera')}
            style={[styles.videoBtn, !vm.videoReady ? styles.btnDisabled : null]}
          >
            <Text style={styles.videoBtnText}>{t('mobile.client.comment.video.record')}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={!vm.videoReady}
          onPress={() => void vm.pickVideo('library')}
          style={[styles.videoBtn, !vm.videoReady ? styles.btnDisabled : null]}
        >
          <Text style={styles.videoBtnText}>{t('mobile.client.comment.video.gallery')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function IncidentRegisterCard(props: {
  canSend: boolean;
  category: IncidentCategory;
  isSubmitting: boolean;
  text: string;
  onChangeText: (value: string) => void;
  onSave: () => void;
  onSaveAndReport: () => void;
  onSelectCategory: (category: IncidentCategory) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const canSave = props.canSend && Boolean(props.text.trim()) && !props.isSubmitting;

  return (
    <View style={styles.incidentCard}>
      <Text style={styles.incidentTitle}>{`⚠  ${t('mobile.client.comment.registerTitle').toUpperCase()}`}</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((item) => {
          const selected = item === props.category;
          const tone = CATEGORY_TONE[item];
          return (
            <Pressable
              key={item}
              onPress={() => props.onSelectCategory(item)}
              style={[styles.chip, selected ? { backgroundColor: tone.bg, borderColor: tone.border } : null]}
            >
              <Text style={[styles.chipText, selected ? { color: tone.text } : null]}>
                {t(`mobile.client.comment.category.${item}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        multiline
        onChangeText={props.onChangeText}
        placeholder={t('mobile.client.comment.incidentPlaceholder')}
        placeholderTextColor={'#fca5a5'}
        style={styles.incidentInput}
        value={props.text}
      />
      {props.isSubmitting ? (
        <ActivityIndicator color={LIGHT.redBg} />
      ) : (
        <View style={styles.incidentActions}>
          <Pressable
            disabled={!canSave}
            onPress={props.onSave}
            style={[styles.saveIncidentBtn, !canSave ? styles.btnDisabled : null]}
          >
            <Text style={styles.incidentActionText}>{t('mobile.client.comment.saveIncident')}</Text>
          </Pressable>
          <Pressable
            disabled={!canSave}
            onPress={props.onSaveAndReport}
            style={[styles.reportIncidentBtn, !canSave ? styles.btnDisabled : null]}
          >
            <Text style={styles.incidentActionText}>{`✓  ${t('mobile.client.comment.saveAndReport')}`}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  videoBox: { gap: 8 },
  videoBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  videoBtnText: { color: LIGHT.accent, fontSize: 12, fontWeight: '800' },
  videoHint: { color: LIGHT.accent, fontSize: 12, fontWeight: '600' },
  videoRow: { flexDirection: 'row', gap: 8 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  backArrow: { color: LIGHT.accent, fontSize: 20, fontWeight: '700' },
  backBtn: {
    alignItems: 'center',
    borderRadius: LIGHT.radiusFull,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  body: { gap: 12, padding: 20 },
  btnDisabled: { opacity: 0.45 },
  cancelIncidentBtn: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelIncidentText: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '800' },
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: LIGHT.text, fontSize: 12, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  header: {
    alignItems: 'center',
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerSpacer: { width: 32 },
  hint: { color: LIGHT.text, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  incidentActions: { flexDirection: 'row', gap: 8 },
  incidentActionText: { color: LIGHT.textOnNavy, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  incidentCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  incidentInput: {
    backgroundColor: LIGHT.bgCard,
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 13,
    minHeight: 88,
    padding: 12,
    textAlignVertical: 'top',
  },
  incidentQuestion: { color: LIGHT.accent, fontSize: 13, fontWeight: '700' },
  incidentTitle: { color: '#b91c1c', fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  incidentToggleRow: {
    alignItems: 'center',
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  openIncidentBtn: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  openIncidentText: { color: LIGHT.accent, fontSize: 12, fontWeight: '800' },
  reportIncidentBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.redBg,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  saveCommentBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusLg,
    paddingVertical: 14,
  },
  saveCommentText: { color: LIGHT.textOnNavy, fontSize: 13, fontWeight: '800' },
  saveIncidentBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.orange,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    width: '100%',
  },
  textarea: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    minHeight: 110,
    padding: 14,
    textAlignVertical: 'top',
  },
  textareaCompact: { minHeight: 80 },
  title: { color: LIGHT.textStrong, flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
