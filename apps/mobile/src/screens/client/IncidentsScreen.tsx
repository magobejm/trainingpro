import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientThreadQuery, useSendChatMessageMutation } from '../../data/hooks/useChat';
import { useArchiveIncidentMutation, useIncidentsListQuery, type IncidentListItem } from '../../data/hooks/useIncidents';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { showError, showToast } from '../../shell/client/feedback';
import { ConfirmModal } from '../../theme/ConfirmModal';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';
import { IncidentCreatePanel } from './IncidentCreateScreen';
import {
  formatIncidentChatNotice,
  formatIncidentDate,
  resolveIncidentCategory,
  type IncidentCategory,
} from './incident-notice.utils';

type IncidentsScreenProps = {
  onClose: () => void;
};

const FORWARD_ICON = '↗';
const TRASH_ICON = '🗑';

const CATEGORY_STYLE: Record<IncidentCategory, { bg: string; border: string; text: string }> = {
  dolor: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  lesion: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
  molestia: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  otro: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
};

export function IncidentsScreen({ onClose }: IncidentsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={creating ? () => setCreating(false) : onClose} title={t('client.incidents.title')} />
      {creating ? (
        <IncidentCreatePanel onCreated={() => setCreating(false)} />
      ) : (
        <HistoryTab onCreate={() => setCreating(true)} />
      )}
    </View>
  );
}

function HistoryTab({ onCreate }: { onCreate: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const query = useIncidentsListQuery();
  const items = query.data ?? [];
  const actions = useIncidentActions();

  return (
    <View style={styles.history}>
      <Pressable onPress={onCreate} style={styles.createBtn}>
        <Text style={styles.createBtnText}>{t('client.incidents.create')}</Text>
      </Pressable>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{t('client.incidents.historyTitle')}</Text>
      </View>
      {query.isPending ? <Text style={styles.empty}>{'...'}</Text> : null}
      {!query.isPending && items.length === 0 ? <Text style={styles.empty}>{t('client.incidents.empty')}</Text> : null}
      {!query.isPending && items.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IncidentCard
              item={item}
              onDelete={() => actions.setDeleting(item)}
              onForward={() => actions.setForwarding(item)}
            />
          )}
        />
      ) : null}
      <ForwardConfirmModal actions={actions} />
      <DeleteConfirmModal actions={actions} />
    </View>
  );
}

function useIncidentActions() {
  const { t } = useTranslation();
  const archiveMutation = useArchiveIncidentMutation();
  const threadQuery = useClientThreadQuery();
  const sendMutation = useSendChatMessageMutation(threadQuery.data?.id ?? '');
  const [forwarding, setForwarding] = useState<IncidentListItem | null>(null);
  const [deleting, setDeleting] = useState<IncidentListItem | null>(null);

  const confirmForward = async () => {
    const item = forwarding;
    if (!item || !threadQuery.data?.id) {
      showError(t('client.incidents.forwardError'));
      return;
    }
    const category = resolveIncidentCategory(item.tag, item.severity);
    try {
      await sendMutation.mutateAsync({
        text: formatIncidentChatNotice({
          category: t(`mobile.client.comment.category.${category}`),
          date: formatIncidentDate(item.createdAt),
          description: item.description,
        }),
      });
      setForwarding(null);
      showToast(t('client.incidents.forwardSuccess'));
    } catch {
      showError(t('client.incidents.forwardError'));
    }
  };

  const confirmDelete = async () => {
    const item = deleting;
    if (!item) return;
    try {
      await archiveMutation.mutateAsync(item.id);
      setDeleting(null);
      showToast(t('client.incidents.deleteSuccess'));
    } catch {
      showError(t('client.incidents.deleteError'));
    }
  };

  return {
    confirmDelete,
    confirmForward,
    deleting,
    forwarding,
    isDeleting: archiveMutation.isPending,
    isForwarding: sendMutation.isPending,
    setDeleting,
    setForwarding,
  };
}

type IncidentActions = ReturnType<typeof useIncidentActions>;

function ForwardConfirmModal({ actions }: { actions: IncidentActions }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      cancelLabel={t('client.incidents.forwardCancel')}
      confirmLabel={t('client.incidents.forwardConfirm')}
      message={t('client.incidents.forwardMessage')}
      onCancel={() => actions.setForwarding(null)}
      onConfirm={() => {
        if (!actions.isForwarding) void actions.confirmForward();
      }}
      title={t('client.incidents.forwardTitle')}
      visible={actions.forwarding != null}
    />
  );
}

function DeleteConfirmModal({ actions }: { actions: IncidentActions }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      cancelLabel={t('client.incidents.deleteCancel')}
      confirmLabel={t('client.incidents.deleteConfirm')}
      message={t('client.incidents.deleteMessage')}
      onCancel={() => actions.setDeleting(null)}
      onConfirm={() => {
        if (!actions.isDeleting) void actions.confirmDelete();
      }}
      title={t('client.incidents.deleteTitle')}
      visible={actions.deleting != null}
    />
  );
}

function IncidentCard(props: { item: IncidentListItem; onDelete: () => void; onForward: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const category = resolveIncidentCategory(props.item.tag, props.item.severity);
  const tone = CATEGORY_STYLE[category];
  return (
    <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, { color: tone.text }]}>{t(`mobile.client.comment.category.${category}`)}</Text>
        </View>
        <Text style={[styles.cardDate, { color: tone.text }]}>{formatIncidentDate(props.item.createdAt)}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: tone.text }]}>{props.item.description}</Text>
      <View style={styles.cardActions}>
        <Pressable onPress={props.onForward} style={styles.iconBtn}>
          <Text style={[styles.iconBtnText, { color: tone.text }]}>{FORWARD_ICON}</Text>
        </Pressable>
        <Pressable onPress={props.onDelete} style={styles.iconBtn}>
          <Text style={styles.trashIcon}>{TRASH_ICON}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LIGHT.radiusLg,
    borderWidth: 2,
    gap: 8,
    padding: 16,
  },
  cardActions: {
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingTop: 12,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  container: SCREEN.root,
  createBtn: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusLg,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createBtnText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    color: LIGHT.textMuted,
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  history: {
    flex: 1,
  },
  historyHeader: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  historyTitle: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 6,
  },
  iconBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  trashIcon: {
    fontSize: 16,
  },
});
