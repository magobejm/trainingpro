import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
import {
  buildClearPayload,
  buildLogPayload,
  readActualValue,
  readLoggedRestSeconds,
  resolveSetSave,
  setWasLogged,
  type LogPayload,
  type SetFieldKey,
  type SetRowState,
} from './active-exercise.helpers';
import type { SessionItem } from '../../data/hooks/useTodaySession';

const FIELD_KEYS: SetFieldKey[] = [
  'distance',
  'duration',
  'fcMaxPct',
  'fcReservePct',
  'heartRate',
  'reps',
  'rest',
  'rir',
  'rom',
  'rpe',
  'weight',
];

export type SaveOutcome = 'failed' | 'pending' | 'skipped' | 'synced';

export function loggedDraft(item: SessionItem, setIndex: number): SetRowState {
  return FIELD_KEYS.reduce((row, key) => {
    row[key] = readActualValue(item, setIndex, key);
    return row;
  }, emptyDraft());
}

export function setDraftMatchesLogged(
  item: SessionItem,
  setIndex: number,
  values: SetRowState,
  restSecondsDone?: number,
): boolean {
  if (!setWasLogged(item, setIndex)) return false;
  const loggedRest = readLoggedRestSeconds(item, setIndex);
  const logged = buildLogPayload(item, setIndex, loggedDraft(item, setIndex), loggedRest);
  const next = buildLogPayload(item, setIndex, values, restSecondsDone ?? loggedRest);
  return canonical(logged) === canonical(next);
}

export function dirtySetIndexes(
  item: SessionItem,
  drafts: Record<number, SetRowState | undefined>,
  setCount: number,
  restBySet: Record<number, number> = {},
): number[] {
  const dirty: number[] = [];
  for (let setIndex = 1; setIndex <= setCount; setIndex += 1) {
    const values = drafts[setIndex];
    if (!values || !setNeedsSave(item, setIndex, values, restBySet[setIndex])) continue;
    dirty.push(setIndex);
  }
  return dirty;
}

export function claimSetSave(inFlight: Set<number>, setIndex: number): boolean {
  if (inFlight.has(setIndex)) return false;
  inFlight.add(setIndex);
  return true;
}

export function saveNoticeKey(outcomes: SaveOutcome[]): null | string {
  if (outcomes.includes('failed')) return null;
  if (outcomes.includes('pending')) return 'mobile.client.sync.savedOffline';
  if (outcomes.includes('synced')) return 'mobile.client.session.setSaved';
  return null;
}

export async function persistOneSet(
  inFlight: Set<number>,
  item: SessionItem,
  setIndex: number,
  values: SetRowState | undefined,
  restSecondsDone: number | undefined,
  send: (body: LogPayload) => Promise<EnqueueResult | 'missing' | void> | void,
): Promise<SaveOutcome> {
  if (!values || !claimSetSave(inFlight, setIndex)) return 'skipped';
  try {
    if (!setNeedsSave(item, setIndex, values, restSecondsDone)) return 'skipped';
    const payload = buildLogPayload(item, setIndex, values, restSecondsDone);
    const action = resolveSetSave(payload, setWasLogged(item, setIndex));
    const body = action === 'delete' ? buildClearPayload(item, setIndex) : payload;
    if (!body) return 'skipped';
    return outcomeFromEnqueue(await send(body));
  } catch {
    return 'failed';
  } finally {
    inFlight.delete(setIndex);
  }
}

export function outcomeFromEnqueue(result: EnqueueResult | 'missing' | void): SaveOutcome {
  if (result === 'pending') return 'pending';
  if (result === 'synced') return 'synced';
  return 'skipped';
}

function setNeedsSave(item: SessionItem, setIndex: number, values: SetRowState, restSecondsDone?: number): boolean {
  if (setDraftMatchesLogged(item, setIndex, values, restSecondsDone)) return false;
  const payload = buildLogPayload(item, setIndex, values, restSecondsDone);
  return resolveSetSave(payload, setWasLogged(item, setIndex)) !== 'skip';
}

function canonical(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'null';
  const entries = Object.entries(payload as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(entries);
}

type SetNavigator = {
  draft: { setCount: number; setCurrentSet: (index: number) => void };
  save: { run: (indexes: number[]) => Promise<SaveOutcome[]> };
};

export function browseOrSave(props: SetNavigator, setIndex: number, readOnly: boolean): void {
  if (readOnly) {
    if (setIndex < props.draft.setCount) props.draft.setCurrentSet(setIndex + 1);
    return;
  }
  void saveAndAdvance(props, setIndex);
}

async function saveAndAdvance(props: SetNavigator, setIndex: number): Promise<void> {
  const outcomes = await props.save.run([setIndex]);
  if (!outcomes.includes('failed') && setIndex < props.draft.setCount) props.draft.setCurrentSet(setIndex + 1);
}

function emptyDraft(): SetRowState {
  return {
    distance: '',
    duration: '',
    fcMaxPct: '',
    fcReservePct: '',
    heartRate: '',
    reps: '',
    rest: '',
    rir: '',
    rom: '',
    rpe: '',
    weight: '',
  };
}
