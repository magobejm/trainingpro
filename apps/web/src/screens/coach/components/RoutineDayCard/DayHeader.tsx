import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

const PLACEHOLDER_COLOR = '#94a3b8';
const ICON_WARMUP = '🔥';
const ICON_REMOVE = '✕';
const ICON_OPEN = '∨';
const ICON_CLOSED = '›';
const ICON_UP = '↑';
const ICON_DOWN = '↓';
const ICON_TRASH = '🗑';
const ICON_NOTES_EMPTY = '📋';
const ICON_NOTES_FILLED = '📋';
const MODAL_ANIM = 'fade' as const;
const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;

interface DayHeaderProps {
  blockCount: number;
  dayNumber: number;
  daysCount: number;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  title: string;
  notes?: null | string;
  notesTitle?: null | string;
  onAddBlock: () => void;
  onMoveDay: (dir: -1 | 1) => void;
  onRemove: () => void;
  onRename: (v: string) => void;
  onToggleCollapse: () => void;
  onUpdateNotes: (notes: null | string, notesTitle: null | string) => void;
  t: (k: string, options?: Record<string, unknown>) => string;
  addExerciseLabelKey?: string;
  sessionPlaceholderKey?: string;
  warmupTemplates?: Array<{ id: string; name: string }>;
  onPickWarmup?: () => void;
  onRemoveWarmup?: (templateId: string) => void;
  onViewWarmup?: (templateId: string) => void;
}

export function DayHeader(props: DayHeaderProps): React.JSX.Element {
  const vm = useDayHeaderModel(props);

  return (
    <View>
      <View style={s.dayCardHeaderRow}>
        <Pressable onPress={props.onToggleCollapse} style={s.dayCollapseBtn}>
          <Text style={s.dayCollapseBtnText}>{props.isCollapsed ? ICON_CLOSED : ICON_OPEN}</Text>
        </Pressable>
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Pressable
          onPress={props.onToggleCollapse}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' } as never}
        >
          <View style={s.dayNumberBadge}>
            <Text style={s.dayNumberBadgeText}>{vm.badge}</Text>
          </View>
          <View style={s.dayTitleBlock}>
            <Text style={s.dayTitleMain}>{vm.dayLabel}</Text>
            <Text style={s.dayTitleSub}>{props.t('coach.routine.exercisesAdded', { count: props.blockCount })}</Text>
          </View>
        </Pressable>
        <TextInput
          editable={!props.readOnly}
          onChangeText={props.onRename}
          placeholder={props.t(vm.placeholderKey)}
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={s.daySessionInput}
          value={props.title}
        />
        {!props.readOnly && (
          <Pressable
            accessibilityRole={ACCESSIBILITY_ROLE_BUTTON}
            onPress={vm.openNotes}
            style={[dhs.notesBtn, vm.hasNotes && dhs.notesBtnActive]}
          >
            <Text style={[dhs.notesIcon, vm.hasNotes && dhs.notesIconActive]}>
              {vm.hasNotes ? ICON_NOTES_FILLED : ICON_NOTES_EMPTY}
            </Text>
          </Pressable>
        )}
        <View style={s.dayHeaderRight}>
          {!props.readOnly && (
            <Pressable onPress={props.onAddBlock} style={s.dayAddExerciseBtn}>
              <Text style={s.dayAddExerciseBtnText}>{props.t(vm.addKey)}</Text>
            </Pressable>
          )}
          {!props.readOnly && (
            <>
              <Pressable
                disabled={props.isFirst}
                onPress={() => props.onMoveDay(-1)}
                style={[s.dayMoveBtn, props.isFirst && { opacity: 0.3 }]}
              >
                <Text style={s.dayMoveBtnText}>{ICON_UP}</Text>
              </Pressable>
              <Pressable
                disabled={props.isLast}
                onPress={() => props.onMoveDay(1)}
                style={[s.dayMoveBtn, props.isLast && { opacity: 0.3 }]}
              >
                <Text style={s.dayMoveBtnText}>{ICON_DOWN}</Text>
              </Pressable>
              {props.daysCount > 1 && (
                <Pressable onPress={props.onRemove} style={s.dayTrashBtn}>
                  <Text style={s.dayTrashBtnText}>{ICON_TRASH}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
      <WarmupTagsRow
        templates={props.warmupTemplates ?? []}
        readOnly={props.readOnly}
        onPick={props.onPickWarmup}
        onRemove={props.onRemoveWarmup}
        onView={props.onViewWarmup}
        t={props.t}
      />
      {vm.notesModalOpen && (
        <DayNotesModal
          notes={props.notes ?? ''}
          notesTitle={props.notesTitle ?? ''}
          onClose={vm.closeNotes}
          onDelete={vm.deleteNotes}
          onSave={vm.saveNotes}
          t={props.t}
        />
      )}
    </View>
  );
}

function useDayHeaderModel(props: DayHeaderProps) {
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const openNotes = () => setNotesModalOpen(true);
  const closeNotes = () => setNotesModalOpen(false);
  const saveNotes = (value: string, title: string) => {
    props.onUpdateNotes(value || null, title || null);
    setNotesModalOpen(false);
  };
  const deleteNotes = () => {
    props.onUpdateNotes(null, null);
    setNotesModalOpen(false);
  };
  return {
    addKey: props.addExerciseLabelKey ?? 'coach.routine.addExercise',
    badge: String(props.dayNumber).padStart(2, '0'),
    closeNotes,
    dayLabel: `Día ${props.dayNumber}`,
    deleteNotes,
    hasNotes: Boolean(props.notes || props.notesTitle),
    notesModalOpen,
    openNotes,
    placeholderKey: props.sessionPlaceholderKey ?? 'coach.routine.sessionNamePlaceholder',
    saveNotes,
  };
}

interface DayNotesModalProps {
  notes: string;
  notesTitle: string;
  onClose: () => void;
  onSave: (value: string, title: string) => void;
  onDelete: () => void;
  t: (k: string) => string;
}

function DayNotesModal({ notes, notesTitle, onClose, onSave, onDelete, t }: DayNotesModalProps): React.JSX.Element {
  const [draft, setDraft] = useState(notes);
  const [draftTitle, setDraftTitle] = useState(notesTitle);
  const hasOriginal = notes.trim().length > 0 || notesTitle.trim().length > 0;
  return (
    <Modal animationType={MODAL_ANIM} transparent onRequestClose={onClose} visible>
      <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={onClose} style={nm.overlay}>
        <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={(e) => e.stopPropagation()} style={nm.sheet}>
          <View style={nm.header}>
            <TextInput
              onChangeText={setDraftTitle}
              placeholder={t('coach.routine.day.notes.defaultTitle')}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={nm.titleInput}
              value={draftTitle}
            />
            <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={onClose} style={nm.closeBtn}>
              <Text style={nm.closeBtnText}>{ICON_REMOVE}</Text>
            </Pressable>
          </View>
          <TextInput
            multiline
            onChangeText={setDraft}
            placeholder={t('coach.routine.day.notes.placeholder')}
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={nm.input}
            value={draft}
          />
          <View style={nm.actions}>
            {hasOriginal && (
              <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={onDelete} style={nm.deleteBtn}>
                <Text style={nm.deleteBtnText}>{t('coach.routine.day.notes.delete')}</Text>
              </Pressable>
            )}
            <View style={nm.spacer} />
            <Pressable
              accessibilityRole={ACCESSIBILITY_ROLE_BUTTON}
              onPress={() => onSave(draft, draftTitle)}
              style={nm.saveBtn}
            >
              <Text style={nm.saveBtnText}>{t('coach.routine.day.notes.save')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WarmupTagsRow(props: {
  templates: Array<{ id: string; name: string }>;
  readOnly: boolean;
  onPick?: () => void;
  onRemove?: (templateId: string) => void;
  onView?: (templateId: string) => void;
  t: (k: string) => string;
}) {
  const hasTemplates = props.templates.length > 0;
  if (!hasTemplates && props.readOnly) return null;
  return (
    <View style={wts.row}>
      {props.templates.map((tpl) => (
        <View key={tpl.id} style={wts.tag}>
          <Pressable onPress={() => props.onView?.(tpl.id)} style={wts.tagLabel}>
            <Text style={wts.tagIcon}>{ICON_WARMUP}</Text>
            <Text style={wts.tagText} numberOfLines={1}>
              {tpl.name}
            </Text>
          </Pressable>
          {!props.readOnly && (
            <Pressable onPress={() => props.onRemove?.(tpl.id)} style={wts.tagRemove}>
              <Text style={wts.tagRemoveText}>{ICON_REMOVE}</Text>
            </Pressable>
          )}
        </View>
      ))}
      {!props.readOnly && (
        <Pressable onPress={props.onPick} style={wts.addBtn}>
          <Text style={wts.addBtnText}>
            {ICON_WARMUP} {props.t('coach.routine.warmup.assign')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const dhs = {
  notesBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'transparent',
    marginRight: 6,
  },
  notesBtnActive: {
    borderColor: '#a78bfa',
    backgroundColor: '#ede9fe',
  },
  notesIcon: {
    fontSize: 16,
    opacity: 0.4,
  },
  notesIconActive: {
    opacity: 1,
  },
};

const nm = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sheet: {
    width: 480,
    maxWidth: '90%' as unknown as number,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    padding: 0,
    marginRight: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  closeBtnText: { fontSize: 12, color: '#64748b' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 120,
    textAlignVertical: 'top' as const,
    backgroundColor: '#f8fafc',
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  spacer: { flex: 1 },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#dc2626' },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6d28d9',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
};

const wts = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 6,
  },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingLeft: 8,
    maxWidth: 280,
  },
  tagLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 4,
    paddingRight: 4,
  },
  tagIcon: { fontSize: 12 },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400e',
    maxWidth: 200,
  },
  tagRemove: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#fbbf24',
  },
  tagRemoveText: { fontSize: 10, color: '#92400e' },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed' as const,
    backgroundColor: '#fefce8',
  },
  addBtnText: { fontSize: 11, color: '#92400e' },
};
