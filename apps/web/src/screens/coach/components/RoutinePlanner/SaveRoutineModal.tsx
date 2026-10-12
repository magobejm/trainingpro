/* eslint-disable max-lines-per-function */
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Button, Modal, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const SCROLL_KEYBOARD_TAPS = 'handled' as const;

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
  const [nameTouched, setNameTouched] = useState(false);
  const nameError = !isGlobal && nameTouched && !name.trim() ? t('coach.clientProfile.validation.required') : null;

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSearch('');
      setSelectedClientId(null);
      setSelectedObjectiveId(null);
      setSaveError(null);
      setIsSaving(false);
      setNameTouched(false);
    }
  }, [visible, initialName]);

  const filtered = clients.filter((c) => {
    const haystack = `${c.firstName} ${c.lastName} ${c.email}`;
    const nameMatches = matchesSearch(haystack, search);
    const matchesObjective = !selectedObjectiveId || c.objectiveId === selectedObjectiveId;
    return nameMatches && matchesObjective;
  });

  function markNameTouched() {
    setNameTouched(true);
  }

  async function handleSaveOnly() {
    markNameTouched();
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
    markNameTouched();
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

  const assignDisabled = !selectedClientId || isSaving || alreadyAssigned;
  const footer = isGlobal ? (
    <Button
      disabled={assignDisabled}
      label={t('coach.routine.saveModal.assignOnly')}
      loading={isSaving}
      onPress={() => void handleAssignOnly()}
    />
  ) : (
    <>
      <Button
        disabled={isSaving}
        label={isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveOnly')}
        onPress={handleSaveOnly}
        variant="secondary"
      />
      <Button
        disabled={assignDisabled}
        label={isSaving ? t('coach.routine.saveModal.saving') : t('coach.routine.saveModal.saveAndAssign')}
        loading={isSaving}
        onPress={handleSaveAndAssign}
      />
    </>
  );

  return (
    <Modal
      closeLabel={t('common.close')}
      dismissOnOverlay
      footer={footer}
      onClose={onClose}
      scroll={false}
      title={isGlobal ? t('coach.routine.saveModal.assignOnlyTitle') : t('coach.routine.saveModal.title')}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps={SCROLL_KEYBOARD_TAPS}
        showsVerticalScrollIndicator={false}
        style={styles.body}
      >
        {alreadyAssigned || saveError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {alreadyAssigned ? t('coach.routine.saveModal.alreadyAssigned') : saveError}
            </Text>
          </View>
        ) : null}
        {!isGlobal && (
          <TextField
            error={nameError}
            label={t('coach.routine.saveModal.name')}
            onBlur={() => setNameTouched(true)}
            onChangeText={setName}
            placeholder={t('coach.routine.saveModal.namePlaceholder')}
            required
            value={name}
          />
        )}
        <View style={styles.field}>
          <TextField
            label={t('coach.routine.saveModal.assignClient')}
            onChangeText={setSearch}
            placeholder={t('coach.routine.saveModal.searchClient')}
            value={search}
          />
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
      {handoff.dialog}
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    maxHeight: '60vh' as unknown as number,
  },
  bodyContent: {
    gap: space.lg,
  },
  field: { gap: space.sm },
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
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorBannerText: { color: colors.danger, fontSize: fontSize.sm, lineHeight: 18 },
});
