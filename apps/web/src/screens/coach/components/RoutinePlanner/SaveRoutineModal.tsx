/* eslint-disable max-lines-per-function */
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useClientsQuery, useClientObjectivesQuery, type ClientView } from '../../../../data/hooks/useClientsQuery';

const MODAL_ANIM = 'fade' as const;
const SCROLL_KEYBOARD_TAPS = 'handled' as const;
const PLACEHOLDER_COLOR = '#94a3b8';
const SEARCH_ICON = '🔍';
const BACK_ICON = '‹';

interface SaveRoutineModalProps {
  visible: boolean;
  initialName: string;
  isGlobal?: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onSaveAndAssign: (name: string, clientId: string) => Promise<void>;
  onAssignOnly?: (clientId: string) => Promise<void>;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

interface ConflictState {
  name: string;
  clientId: string;
  clientName: string;
  existingRoutineName: string;
}

function ClientRow({ client, isSelected, onPress }: { client: ClientView; isSelected: boolean; onPress: () => void }) {
  const initials = `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase();
  return (
    <Pressable onPress={onPress} style={[styles.clientRow, isSelected && styles.clientRowSelected]}>
      <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
        {client.avatarUrl ? (
          <Image source={{ uri: client.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>{initials}</Text>
        )}
      </View>
      <Text style={[styles.clientName, isSelected && styles.clientNameSelected]}>
        {`${client.firstName} ${client.lastName}`}
      </Text>
      {isSelected && <Text style={styles.checkIcon}>{CHECK_ICON}</Text>}
    </Pressable>
  );
}

const CHECK_ICON = '✓';

function ConflictWarning({
  conflict,
  onConfirm,
  onCancel,
  t,
}: {
  conflict: ConflictState;
  onConfirm: () => void;
  onCancel: () => void;
  t: SaveRoutineModalProps['t'];
}) {
  return (
    <View style={styles.conflictBox}>
      <Text style={styles.conflictText}>
        {t('coach.routine.saveModal.conflictMessage', {
          client: conflict.clientName,
          routine: conflict.existingRoutineName,
        })}
      </Text>
      <View style={styles.conflictBtns}>
        <Pressable onPress={onCancel} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>{t('common.cancel')}</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>{t('coach.routine.saveModal.confirm')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function noop() {}

export function SaveRoutineModal(props: SaveRoutineModalProps) {
  const { visible, initialName, isGlobal, onClose, onSave, onSaveAndAssign, onAssignOnly, t } = props;
  const { data: clients = [] } = useClientsQuery();
  const { data: objectives = [] } = useClientObjectivesQuery();
  const [name, setName] = useState(initialName);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSearch('');
      setSelectedClientId(null);
      setSelectedObjectiveId(null);
      setConflict(null);
      setSaveError(null);
      setIsSaving(false);
    }
  }, [visible, initialName]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchesObjective = !selectedObjectiveId || c.objectiveId === selectedObjectiveId;
    return matchesSearch && matchesObjective;
  });

  async function handleSaveOnly() {
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(name);
      onClose();
    } catch (err) {
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAndAssign() {
    if (!selectedClientId) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    if (client.trainingPlan) {
      setConflict({
        name,
        clientId: selectedClientId,
        clientName: `${client.firstName} ${client.lastName}`,
        existingRoutineName: client.trainingPlan.name,
      });
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSaveAndAssign(name, selectedClientId);
      onClose();
    } catch (err) {
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConflictConfirm() {
    if (!conflict) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSaveAndAssign(conflict.name, conflict.clientId);
      setConflict(null);
      onClose();
    } catch (err) {
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
      setConflict(null);
    } finally {
      setIsSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal animationType={MODAL_ANIM} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={noop} style={styles.modal}>
          {/* ── Scrollable body ── */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={SCROLL_KEYBOARD_TAPS}
          >
            <Pressable onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>{BACK_ICON}</Text>
              <Text style={styles.backText}>{t('coach.library.detail.back')}</Text>
            </Pressable>
            <Text style={styles.title}>
              {isGlobal ? t('coach.routine.saveModal.assignOnlyTitle') : t('coach.routine.saveModal.title')}
            </Text>
            {!isGlobal && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('coach.routine.saveModal.name')}</Text>
                <TextInput
                  onChangeText={setName}
                  placeholder={t('coach.routine.saveModal.namePlaceholder')}
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  style={styles.input}
                  value={name}
                />
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('coach.routine.saveModal.assignClient')}</Text>
              <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>{SEARCH_ICON}</Text>
                <TextInput
                  onChangeText={setSearch}
                  placeholder={t('coach.routine.saveModal.searchClient')}
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  style={styles.searchInput}
                  value={search}
                />
              </View>
              {objectives.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.objectiveFilterRow}
                  contentContainerStyle={styles.objectiveFilterContent}
                >
                  {objectives.map((obj) => {
                    const active = selectedObjectiveId === obj.id;
                    return (
                      <Pressable
                        key={obj.id}
                        onPress={() => setSelectedObjectiveId(active ? null : obj.id)}
                        style={[styles.objectiveChip, active && styles.objectiveChipActive]}
                      >
                        <Text style={[styles.objectiveChipText, active && styles.objectiveChipTextActive]}>{obj.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
              <Text style={styles.sectionLabel}>{t('coach.routine.saveModal.quickAssign')}</Text>
              {filtered.map((client) => (
                <ClientRow
                  client={client}
                  isSelected={client.id === selectedClientId}
                  key={client.id}
                  onPress={() => setSelectedClientId((prev) => (prev === client.id ? null : client.id))}
                />
              ))}
            </View>
            {conflict && (
              <ConflictWarning
                conflict={conflict}
                onCancel={() => setConflict(null)}
                onConfirm={handleConflictConfirm}
                t={t}
              />
            )}
          </ScrollView>

          {/* ── Sticky footer ── */}
          {saveError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{saveError}</Text>
            </View>
          ) : null}
          {!conflict &&
            (isGlobal ? (
              <View style={styles.footer}>
                <Pressable
                  disabled={!selectedClientId || isSaving}
                  onPress={async () => {
                    if (!selectedClientId || !onAssignOnly) return;
                    await onAssignOnly(selectedClientId);
                    onClose();
                  }}
                  style={[styles.btnPrimary, (!selectedClientId || isSaving) && styles.btnDisabled]}
                >
                  <Text style={styles.btnPrimaryText}>{t('coach.routine.saveModal.assignOnly')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.footer}>
                <Pressable
                  disabled={isSaving}
                  onPress={handleSaveOnly}
                  style={[styles.btnSecondary, isSaving && styles.btnDisabled]}
                >
                  <Text style={styles.btnSecondaryText}>
                    {isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveOnly')}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={!selectedClientId || isSaving}
                  onPress={handleSaveAndAssign}
                  style={[styles.btnPrimary, (!selectedClientId || isSaving) && styles.btnDisabled]}
                >
                  <Text style={styles.btnPrimaryText}>
                    {isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveAndAssign')}
                  </Text>
                </Pressable>
              </View>
            ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 420,
    maxWidth: '92%',
    maxHeight: '88%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    gap: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backIcon: { fontSize: 22, color: '#64748b', lineHeight: 24 },
  backText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#1e293b' },
  objectiveFilterRow: { marginTop: 8 },
  objectiveFilterContent: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  objectiveChip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#f8fafc',
  },
  objectiveChipActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  objectiveChipText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  objectiveChipTextActive: { color: '#2563eb' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  clientRowSelected: { backgroundColor: '#eff6ff' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: '#3b82f6' },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  avatarTextSelected: { color: '#fff' },
  clientName: { flex: 1, fontSize: 14, color: '#1e293b' },
  clientNameSelected: { color: '#2563eb', fontWeight: '600' },
  checkIcon: { fontSize: 16, color: '#2563eb' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnSecondaryText: { color: '#475569', fontSize: 13 },
  btnDisabled: { backgroundColor: '#94a3b8' },
  conflictBox: { gap: 12, backgroundColor: '#fef9c3', borderRadius: 8, padding: 12 },
  conflictText: { fontSize: 13, color: '#92400e', lineHeight: 20 },
  conflictBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderTopWidth: 1,
    borderTopColor: '#fca5a5',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  errorBannerText: { color: '#991b1b', fontSize: 13, lineHeight: 18 },
});
