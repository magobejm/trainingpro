import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { blockTagColors } from '../components/RoutineBlockCard/BlockHeader';
import {
  canUnlockSetVariable,
  resolveLockedFields,
  type ExerciseBlockType,
  type RoutineEditorItemKind,
  type RoutineEditorItemMeta,
  type SetVariableKey,
} from '@trainerpro/shared';
import { ActionConfirmModal } from '../components/ActionConfirmModal';
import { AdvancedSeriesModal } from '../components/RoutineBlockCard/AdvancedSeriesModal';
import { SeriesNoteModal } from '../components/RoutineBlockCard/SeriesNoteModal';
import { ClientSeriesTable, type GridSet, type SetPatch } from './ClientSeriesTable';
import { DragHandle } from './ItemDrag';
import { ItemPrescription } from './ItemPrescription';
import { ItemNoteModal } from './ItemNoteModal';

type Translate = (key: string) => string;

export type CardItem = {
  displayName: string;
  durationMinutes: number | null;
  groupId: string | null;
  id: string;
  kind: RoutineEditorItemKind;
  lockedFields: string[];
  notes: null | string;
  repsRange: string | null;
  sets: GridSet[];
};

export type CardSelection = { onToggle: () => void; selected: boolean };

/** Everything a card can do to its item, already bound to that item. */
export type ItemActions = {
  onAddSet: () => void;
  onDuplicate?: () => void;
  onMeta: (meta: RoutineEditorItemMeta) => void;
  onMove?: (direction: 'down' | 'up') => void;
  onPatchSet: (setId: string, patch: SetPatch) => void;
  onRemove: () => void;
  onRemoveSet: (setId: string) => void;
  onReplace?: () => void;
};

const ICON = { down: '↓', duplicate: '⧉', minus: '−', note: '📝', plus: '+', remove: '🗑', replace: '⇄', up: '↑' };
const FOLD = { closed: '▸', open: '▾' };
const CHECK = '✓';

function IconButton(props: {
  disabled?: boolean;
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.iconButton, props.active && styles.iconActive, props.disabled && styles.iconDisabled]}
    >
      <Text style={styles.iconText}>{props.icon}</Text>
    </TouchableOpacity>
  );
}

function EditTools(props: {
  actions: ItemActions;
  drag: { dayId: string; index: number; onDragEnd: () => void } | null;
  first: boolean;
  item: CardItem;
  last: boolean;
  t: Translate;
}) {
  const { actions, t } = props;
  return (
    <View style={styles.tools}>
      {props.drag ? (
        <DragHandle
          dayId={props.drag.dayId}
          index={props.drag.index}
          label={t('coach.clientRoutine.drag')}
          onDragEnd={props.drag.onDragEnd}
        />
      ) : null}
      {actions.onMove ? (
        <>
          <IconButton
            disabled={props.first}
            icon={ICON.up}
            label={t('coach.clientRoutine.moveUp')}
            onPress={() => actions.onMove?.('up')}
          />
          <IconButton
            disabled={props.last}
            icon={ICON.down}
            label={t('coach.clientRoutine.moveDown')}
            onPress={() => actions.onMove?.('down')}
          />
        </>
      ) : null}
      {actions.onDuplicate ? (
        <IconButton icon={ICON.duplicate} label={t('coach.clientRoutine.duplicate')} onPress={actions.onDuplicate} />
      ) : null}
      {actions.onReplace ? (
        <IconButton icon={ICON.replace} label={t('coach.clientRoutine.replace')} onPress={actions.onReplace} />
      ) : null}
      <IconButton icon={ICON.remove} label={t('coach.clientRoutine.remove')} onPress={actions.onRemove} />
    </View>
  );
}

function SetCount(props: { actions: ItemActions; item: CardItem; t: Translate }): React.JSX.Element {
  const { item, t } = props;
  const last = item.sets[item.sets.length - 1];
  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>{t('coach.clientRoutine.seriesCount')}</Text>
      <IconButton
        disabled={item.sets.length <= 1}
        icon={ICON.minus}
        label={t('coach.clientRoutine.removeSet')}
        onPress={() => last && props.actions.onRemoveSet(last.id)}
      />
      <Text style={styles.counterValue}>{item.sets.length}</Text>
      <IconButton icon={ICON.plus} label={t('coach.clientRoutine.addSet')} onPress={props.actions.onAddSet} />
    </View>
  );
}

function ItemModals(props: {
  actions: ItemActions;
  advancedSet: GridSet | null;
  editable: boolean;
  item: CardItem;
  lockLimit: boolean;
  noteSet: GridSet | null;
  notes: boolean;
  onCloseLockLimit: () => void;
  onCloseNotes: () => void;
  setAdvancedSet: (set: GridSet | null) => void;
  setNoteSet: (set: GridSet | null) => void;
  t: Translate;
}): React.JSX.Element {
  const { actions, advancedSet, editable, item, noteSet, setAdvancedSet, setNoteSet, t } = props;
  return (
    <>
      <ItemNoteModal
        editable={editable}
        onClose={props.onCloseNotes}
        onSave={(value) => actions.onMeta({ notes: value || null })}
        t={t}
        title={t('coach.clientRoutine.itemNotes')}
        value={item.notes ?? ''}
        visible={props.notes}
      />
      <AdvancedSeriesModal
        currentValue={advancedSet?.advancedTechnique ?? undefined}
        onApply={(technique) => advancedSet && actions.onPatchSet(advancedSet.id, { advancedTechnique: technique })}
        onClose={() => setAdvancedSet(null)}
        onRemove={() => {
          if (advancedSet) actions.onPatchSet(advancedSet.id, { advancedTechnique: null });
          setAdvancedSet(null);
        }}
        seriesIndex={advancedSet?.setIndex ?? 0}
        viewOnly={!editable}
        visible={advancedSet != null}
      />
      {editable ? (
        <SeriesNoteModal
          onClose={() => setNoteSet(null)}
          onSave={(note) => noteSet && actions.onPatchSet(noteSet.id, { note: note || null })}
          seriesIndex={noteSet?.setIndex ?? 0}
          value={noteSet?.note ?? ''}
          visible={noteSet != null}
        />
      ) : (
        <ItemNoteModal
          editable={false}
          onClose={() => setNoteSet(null)}
          onSave={() => undefined}
          t={t}
          title={t('coach.clientRoutine.setNote')}
          value={noteSet?.note ?? ''}
          visible={noteSet != null}
        />
      )}
      <ActionConfirmModal
        cancelLabel={t('common.close')}
        message={t('coach.routine.seriesTable.lockLimitMessage')}
        onCancel={props.onCloseLockLimit}
        title={t('coach.routine.seriesTable.lockLimitTitle')}
        visible={props.lockLimit}
      />
    </>
  );
}

function blockTypeOf(kind: RoutineEditorItemKind): ExerciseBlockType {
  return kind === 'exercise' ? 'strength' : kind;
}

/** Saved locks win. An empty list uses the same defaults as the routine planner. */
function nextLocks(kind: RoutineEditorItemKind, current: string[], variable: SetVariableKey): string[] | null {
  const type = blockTypeOf(kind);
  const locked = resolveLockedFields(type, current);
  if (locked.includes(variable) && !canUnlockSetVariable(type, locked, variable)) return null;
  return locked.includes(variable) ? locked.filter((key) => key !== variable) : [...locked, variable];
}

function KindTag(props: { kind: RoutineEditorItemKind; t: Translate }): React.JSX.Element {
  const type = props.kind === 'exercise' ? 'strength' : props.kind;
  const tag = blockTagColors[type];
  return (
    <View style={[styles.tag, { backgroundColor: tag.bg }]}>
      <Text style={[styles.tagText, { color: tag.text }]}>{props.t(`coach.routine.blockType.${type}`)}</Text>
    </View>
  );
}

export function RoutineItemCard(props: {
  actions: ItemActions;
  drag: { dayId: string; index: number; onDragEnd: () => void } | null;
  editable: boolean;
  first: boolean;
  item: CardItem;
  last: boolean;
  selection?: CardSelection | null;
  t: Translate;
}): React.JSX.Element {
  const { actions, editable, item, selection, t } = props;
  const [open, setOpen] = useState(true);
  const [advancedOn, setAdvancedOn] = useState(false);
  const [notes, setNotes] = useState(false);
  const [advancedSet, setAdvancedSet] = useState<GridSet | null>(null);
  const [noteSet, setNoteSet] = useState<GridSet | null>(null);
  const [lockLimit, setLockLimit] = useState(false);
  const locks = resolveLockedFields(blockTypeOf(item.kind), item.lockedFields);
  const toggleLock = (variable: SetVariableKey) => {
    const next = nextLocks(item.kind, locks, variable);
    if (!next) {
      setLockLimit(true);
      return;
    }
    actions.onMeta({ lockedFields: next });
  };
  return (
    <View style={[styles.card, selection?.selected && styles.cardSelected]}>
      <View style={styles.head}>
        {selection ? (
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selection.selected }}
            onPress={selection.onToggle}
            style={[styles.check, selection.selected && styles.checkOn]}
          >
            <Text style={styles.checkMark}>{selection.selected ? CHECK : ''}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={selection ? selection.onToggle : () => setOpen(!open)} style={styles.title}>
          <Text style={styles.fold}>{open ? FOLD.open : FOLD.closed}</Text>
          <Text style={styles.name}>{item.displayName}</Text>
          <KindTag kind={item.kind} t={t} />
        </TouchableOpacity>
        {item.notes || editable ? (
          <IconButton
            active={Boolean(item.notes)}
            icon={ICON.note}
            label={t('coach.clientRoutine.itemNotes')}
            onPress={() => setNotes(true)}
          />
        ) : null}
        {editable ? (
          <EditTools actions={actions} drag={props.drag} first={props.first} item={item} last={props.last} t={t} />
        ) : null}
      </View>
      {open ? (
        <>
          <View style={styles.toolbar}>
            {editable ? <SetCount actions={actions} item={item} t={t} /> : null}
            <ItemPrescription editable={editable} item={item} onChange={actions.onMeta} t={t} />
            <TouchableOpacity onPress={() => setAdvancedOn(!advancedOn)}>
              <Text style={[styles.toggle, advancedOn && styles.toggleOn]}>{t('coach.clientRoutine.advancedToggle')}</Text>
            </TouchableOpacity>
          </View>
          <ClientSeriesTable
            advancedOn={advancedOn}
            editable={editable}
            kind={item.kind}
            lockedFields={locks}
            onAdd={actions.onAddSet}
            onOpenAdvanced={setAdvancedSet}
            onOpenNote={setNoteSet}
            onPatch={actions.onPatchSet}
            onRemove={actions.onRemoveSet}
            onToggleLock={toggleLock}
            sets={item.sets}
            t={t}
          />
        </>
      ) : null}
      <ItemModals
        actions={actions}
        advancedSet={advancedSet}
        editable={editable}
        item={item}
        noteSet={noteSet}
        lockLimit={lockLimit}
        notes={notes}
        onCloseLockLimit={() => setLockLimit(false)}
        onCloseNotes={() => setNotes(false)}
        setAdvancedSet={setAdvancedSet}
        setNoteSet={setNoteSet}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    maxWidth: '100%',
    minWidth: 0,
    padding: space.sm,
  },
  cardSelected: { borderColor: colors.primary, borderWidth: 2 },
  check: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkMark: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  counter: { alignItems: 'center', flexDirection: 'row', gap: space.xs },
  counterLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  counterValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  fold: { color: colors.textMuted, fontSize: fontSize.sm },
  head: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  iconActive: { backgroundColor: colors.primarySoft },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconDisabled: { opacity: 0.35 },
  iconText: { color: colors.text, fontSize: fontSize.sm },
  name: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  tag: { borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 2 },
  tagText: { fontSize: fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
  title: { alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, gap: space.sm },
  toggle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  toggleOn: { color: colors.danger },
  toolbar: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tools: { flexDirection: 'row', gap: space.xs },
});
