/* eslint-disable max-lines-per-function */
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDialogFocus } from '../../../../layout/useDialogFocus';
import { useClientsQuery, useClientObjectivesQuery, type ClientView } from '../../../../data/hooks/useClientsQuery';
import { matchesSearch } from '../../../../utils/normalize-search';
import { useRoutineHandoffPrompt } from '../../RoutineHandoffDialog';
import {
  chooseRoutineHandoff,
  isSameAssignedRoutine,
  loadClientCalendarEvents,
  localCalendarDay,
  type RoutineAssignOptions,
} from '../../routine-handoff';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIM = 'fade' as const;
const SCROLL_KEYBOARD_TAPS = 'handled' as const;
const PLACEHOLDER_COLOR = colors.textMuted;
const SEARCH_ICON = '🔍';
const BACK_ICON = '‹';

function isVersionConflict(error: unknown): boolean {
  return typeof error === 'object' && error != null && 'status' in error && error.status === 409;
}

interface SaveRoutineModalProps {
  visible: boolean;
  initialName: string;
  isGlobal?: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onSaveAndAssign: (name: string, clientId: string, options?: RoutineAssignOptions) => Promise<void>;
  onAssignOnly?: (clientId: string, options?: RoutineAssignOptions) => Promise<void>;
  templateId?: string | null;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function ClientRow({ client, isSelected, onPress }: { client: ClientView; isSelected: boolean; onPress: () => void }) {
  const initials = `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.clientRow, isSelected && styles.clientRowSelected]}
    >
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

function clientHasSameRoutine(client: ClientView | undefined, templateId: string | null | undefined): boolean {
  if (!client || !templateId) return false;
  return isSameAssignedRoutine(client.trainingPlanId, client.trainingPlan?.id, templateId);
}

function noop() {}

export function SaveRoutineModal(props: SaveRoutineModalProps) {
  const { visible, initialName, isGlobal, onClose, onSave, onSaveAndAssign, onAssignOnly, templateId, t } = props;
  const { data: clients = [] } = useClientsQuery();
  const { data: objectives = [] } = useClientObjectivesQuery();
  const [name, setName] = useState(initialName);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const handoff = useRoutineHandoffPrompt(t);
  const dialogRef = useRef<View>(null);
  useDialogFocus(visible, dialogRef);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSearch('');
      setSelectedClientId(null);
      setSelectedObjectiveId(null);
      setSaveError(null);
      setIsSaving(false);
    }
  }, [visible, initialName]);

  const filtered = clients.filter((c) => {
    const haystack = `${c.firstName} ${c.lastName} ${c.email}`;
    const nameMatches = matchesSearch(haystack, search);
    const matchesObjective = !selectedObjectiveId || c.objectiveId === selectedObjectiveId;
    return nameMatches && matchesObjective;
  });

  async function handleSaveOnly() {
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(name);
      onClose();
    } catch (err) {
      if (isVersionConflict(err)) return;
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
    } finally {
      setIsSaving(false);
    }
  }

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const alreadyAssigned = clientHasSameRoutine(selectedClient, templateId);

  async function resolveHandoff(clientId: string): Promise<RoutineAssignOptions | null> {
    const client = clients.find((item) => item.id === clientId);
    const outcome = await chooseRoutineHandoff({
      ask: handoff.ask,
      hasOtherRoutine: Boolean(client?.trainingPlanId || client?.trainingPlan),
      loadPending: (from, to) => loadClientCalendarEvents(clientId, from, to),
      sameRoutine: clientHasSameRoutine(client, templateId),
      today: localCalendarDay(),
    });
    if (outcome === 'cancel' || outcome === 'same') return null;
    return outcome === 'replace' ? { clearFutureFrom: localCalendarDay() } : {};
  }

  async function handleSaveAndAssign() {
    if (!selectedClientId || alreadyAssigned) return;
    const options = await resolveHandoff(selectedClientId);
    if (!options) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSaveAndAssign(name, selectedClientId, options);
      onClose();
    } catch (err) {
      if (isVersionConflict(err)) return;
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignOnly() {
    if (!selectedClientId || !onAssignOnly || alreadyAssigned) return;
    const options = await resolveHandoff(selectedClientId);
    if (!options) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onAssignOnly(selectedClientId, options);
      onClose();
    } catch (err) {
      if (isVersionConflict(err)) return;
      const raw = (err as { message?: string })?.message ?? '';
      setSaveError(raw || t('coach.routine.saveModal.saveErrorFallback'));
    } finally {
      setIsSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={noop} ref={dialogRef} style={styles.modal}>
          {/* ── Scrollable body ── */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={SCROLL_KEYBOARD_TAPS}
          >
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.backBtn}>
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
          </ScrollView>

          {/* ── Sticky footer ── */}
          {alreadyAssigned || saveError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {alreadyAssigned ? t('coach.routine.saveModal.alreadyAssigned') : saveError}
              </Text>
            </View>
          ) : null}
          {isGlobal ? (
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={!selectedClientId || isSaving || alreadyAssigned}
                onPress={() => void handleAssignOnly()}
                style={[styles.btnPrimary, (!selectedClientId || isSaving || alreadyAssigned) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>{t('coach.routine.saveModal.assignOnly')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handleSaveOnly}
                style={[styles.btnSecondary, isSaving && styles.btnDisabled]}
              >
                <Text style={styles.btnSecondaryText}>
                  {isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveOnly')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!selectedClientId || isSaving || alreadyAssigned}
                onPress={handleSaveAndAssign}
                style={[styles.btnPrimary, (!selectedClientId || isSaving || alreadyAssigned) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>
                  {isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveAndAssign')}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
      {handoff.dialog}
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
    backgroundColor: colors.surface,
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
    padding: space.xl,
    gap: space.lg,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  backIcon: { fontSize: fontSize.xl, color: colors.textMuted, lineHeight: 24 },
  backText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  field: { gap: space.sm },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  searchIcon: { fontSize: fontSize.sm, marginRight: space.sm },
  searchInput: { flex: 1, paddingVertical: space.sm, fontSize: fontSize.sm, color: colors.text },
  objectiveFilterRow: { marginTop: space.sm },
  objectiveFilterContent: { flexDirection: 'row', gap: space.sm, paddingVertical: 2 },
  objectiveChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    backgroundColor: colors.surfaceMuted,
  },
  objectiveChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  objectiveChipText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },
  objectiveChipTextActive: { color: colors.primary },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: space.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    gap: space.md,
  },
  clientRowSelected: { backgroundColor: colors.primarySoft },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: colors.primary },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  avatarTextSelected: { color: colors.surface },
  clientName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  clientNameSelected: { color: colors.primary, fontWeight: '600' },
  checkIcon: { fontSize: fontSize.md, color: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    backgroundColor: colors.surface,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  btnPrimaryText: { color: colors.surface, fontSize: fontSize.sm, fontWeight: '600' },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  btnSecondaryText: { color: colors.textMuted, fontSize: fontSize.sm },
  btnDisabled: { backgroundColor: colors.borderStrong },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderTopWidth: 1,
    borderTopColor: colors.dangerSoft,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  errorBannerText: { color: colors.danger, fontSize: fontSize.sm, lineHeight: 18 },
});
