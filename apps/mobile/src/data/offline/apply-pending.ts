import { sessionOutcome } from '@trainerpro/shared';
import type {
  CardioSessionItem,
  IntervalLog,
  IsometricSessionItem,
  IsometricSetLog,
  MobilitySessionItem,
  MobilitySetLog,
  PlioSessionItem,
  PlioSetLog,
  SessionItem,
  SessionView,
  SetLog,
  SportSessionItem,
  SportSetLog,
} from '@trainerpro/shared';
import type { SessionOp } from './session-draft';

const METRIC_KEYS = [
  'avgHeartRate',
  'avgHeartRateMax',
  'distanceDoneMeters',
  'durationSecondsDone',
  'effortRir',
  'effortRpe',
  'heartRateDone',
  'heartRateDoneMax',
  'hrMaxPctDone',
  'hrMaxPctDoneMax',
  'hrReservePctDone',
  'hrReservePctDoneMax',
  'repsDone',
  'restSecondsDone',
  'romDone',
  'weightDoneKg',
];

export function applyPendingOps(session: SessionView, ops: SessionOp[]): SessionView {
  const view = ops.reduce((current, op) => applyOp(current, op), session);
  return { ...view, outcome: sessionOutcome(view) };
}

function applyOp(session: SessionView, op: SessionOp): SessionView {
  if (op.kind === 'start') return applyStart(session, op);
  if (op.kind === 'finish') return applyFinish(session, op);
  if (op.kind === 'finish-exercise') return applyFinishExercise(session, op);
  return { ...session, items: session.items.map((item) => applyItem(item, op)) };
}

function applyFinishExercise(session: SessionView, op: SessionOp): SessionView {
  const itemId = textOrNull(asRecord(op.body)['itemId']);
  if (!itemId) return session;
  const target = session.items.find((item) => item.id === itemId);
  if (!target || typeof target.completionOrder === 'number') return session;
  const completionOrder = nextCompletionOrder(session.items);
  return {
    ...session,
    items: session.items.map((item) => (item.id === itemId ? { ...item, completionOrder } : item)),
  };
}

function nextCompletionOrder(items: SessionItem[]): number {
  return (
    items.reduce((highest, item) => {
      return typeof item.completionOrder === 'number' ? Math.max(highest, item.completionOrder) : highest;
    }, 0) + 1
  );
}

function applyStart(session: SessionView, op: SessionOp): SessionView {
  const body = asRecord(op.body);
  return {
    ...session,
    preFatigue: numOrNull(body['preFatigue']) ?? session.preFatigue,
    preMotivation: numOrNull(body['preMotivation']) ?? session.preMotivation,
    preRecovery: numOrNull(body['preRecovery']) ?? session.preRecovery,
    startMode: readStartMode(body['startMode']) ?? session.startMode,
    startedAt: session.startedAt ?? op.createdAt,
    status: session.status === 'COMPLETED' ? session.status : 'IN_PROGRESS',
  };
}

function applyFinish(session: SessionView, op: SessionOp): SessionView {
  const body = asRecord(op.body);
  return {
    ...session,
    finishComment: textOrNull(body['comment']),
    finishedAt: textOrNull(body['finishedAt']) ?? session.finishedAt ?? op.createdAt,
    performedDurationSeconds: numOrNull(body['performedDurationSeconds']) ?? session.performedDurationSeconds ?? null,
    isCompleted: true,
    isIncomplete: body['isIncomplete'] === true,
    postFatigue: numOrNull(body['postFatigue']),
    postMood: numOrNull(body['postMood']),
    postPain: numOrNull(body['postPain']),
    sessionRpe: numOrNull(body['sessionRpe']),
    status: 'COMPLETED',
  };
}

function applyItem(item: SessionItem, op: SessionOp): SessionItem {
  const target = readTarget(op);
  if (!target || item.id !== target.id) return item;
  const body = asRecord(op.body);
  if (item.type === 'cardio' && op.kind === 'cardio-distance')
    return { ...item, distanceDoneMeters: numOrNull(body['distanceDoneMeters']) };
  const clear = clearsLog(body);
  if (item.type === 'strength' && op.kind === 'log-set') return applyStrength(item, body, target.index, clear);
  if (item.type === 'plio' && op.kind === 'log-plio-set') return applyPlio(item, body, target.index, clear);
  if (item.type === 'mobility' && op.kind === 'log-mobility-set') return applyMobility(item, body, target.index, clear);
  if (item.type === 'isometric' && op.kind === 'log-isometric-set') return applyIsometric(item, body, target.index, clear);
  if (item.type === 'cardio' && op.kind === 'log-interval') return applyCardio(item, body, target.index, clear);
  if (item.type === 'sport' && op.kind === 'sport-set') return applySportSet(item, body, target.index, clear);
  return item;
}

function applyStrength(
  item: Extract<SessionItem, { type: 'strength' }>,
  body: Record<string, unknown>,
  setIndex: number,
  clear: boolean,
) {
  const next: SetLog | null = clear
    ? null
    : {
        effortRir: numOrNull(body['effortRir']),
        effortRpe: numOrNull(body['effortRpe']),
        repsDone: numOrNull(body['repsDone']),
        restSecondsDone: numOrNull(body['restSecondsDone']),
        sessionItemId: item.id,
        setIndex,
        weightDoneKg: numOrNull(body['weightDoneKg']),
      };
  return { ...item, logs: upsertIndex(item.logs, setIndex, next) };
}

function applyPlio(item: PlioSessionItem, body: Record<string, unknown>, setIndex: number, clear: boolean): PlioSessionItem {
  const next: PlioSetLog | null = clear
    ? null
    : {
        durationSecondsDone: numOrNull(body['durationSecondsDone']),
        effortRpe: numOrNull(body['effortRpe']),
        repsDone: numOrNull(body['repsDone']),
        restSecondsDone: numOrNull(body['restSecondsDone']),
        sessionPlioBlockId: item.id,
        setIndex,
        weightDoneKg: numOrNull(body['weightDoneKg']),
      };
  return { ...item, logs: upsertIndex(item.logs, setIndex, next) };
}

function applyMobility(
  item: MobilitySessionItem,
  body: Record<string, unknown>,
  setIndex: number,
  clear: boolean,
): MobilitySessionItem {
  const next: MobilitySetLog | null = clear
    ? null
    : {
        effortRpe: numOrNull(body['effortRpe']),
        repsDone: numOrNull(body['repsDone']),
        restSecondsDone: numOrNull(body['restSecondsDone']),
        romDone: textOrNull(body['romDone']),
        sessionMobilityBlockId: item.id,
        setIndex,
        weightDoneKg: numOrNull(body['weightDoneKg']),
      };
  return { ...item, logs: upsertIndex(item.logs, setIndex, next) };
}

function applyIsometric(
  item: IsometricSessionItem,
  body: Record<string, unknown>,
  setIndex: number,
  clear: boolean,
): IsometricSessionItem {
  const next: IsometricSetLog | null = clear
    ? null
    : {
        durationSecondsDone: numOrNull(body['durationSecondsDone']),
        effortRpe: numOrNull(body['effortRpe']),
        restSecondsDone: numOrNull(body['restSecondsDone']),
        sessionIsometricBlockId: item.id,
        setIndex,
        weightDoneKg: numOrNull(body['weightDoneKg']),
      };
  return { ...item, logs: upsertIndex(item.logs, setIndex, next) };
}

function applyCardio(
  item: CardioSessionItem,
  body: Record<string, unknown>,
  intervalIndex: number,
  clear: boolean,
): CardioSessionItem {
  const next: IntervalLog | null = clear
    ? null
    : {
        avgHeartRate: numOrNull(body['avgHeartRate']),
        avgHeartRateMax: numOrNull(body['avgHeartRateMax']),
        distanceDoneMeters: numOrNull(body['distanceDoneMeters']),
        durationSecondsDone: numOrNull(body['durationSecondsDone']),
        effortRpe: numOrNull(body['effortRpe']),
        hrMaxPctDone: numOrNull(body['hrMaxPctDone']),
        hrMaxPctDoneMax: numOrNull(body['hrMaxPctDoneMax']),
        hrReservePctDone: numOrNull(body['hrReservePctDone']),
        hrReservePctDoneMax: numOrNull(body['hrReservePctDoneMax']),
        intervalIndex,
        restSecondsDone: numOrNull(body['restSecondsDone']),
        sessionCardioBlockId: item.id,
      };
  const intervalLogs = item.intervalLogs.filter((entry) => entry.intervalIndex !== intervalIndex);
  if (!next) return { ...item, intervalLogs };
  const sorted = [...intervalLogs, next].sort((left, right) => left.intervalIndex - right.intervalIndex);
  return { ...item, intervalLogs: sorted };
}

function applySportSet(
  item: SportSessionItem,
  body: Record<string, unknown>,
  setIndex: number,
  clear: boolean,
): SportSessionItem {
  const next: SportSetLog | null = clear
    ? null
    : {
        distanceDoneMeters: numOrNull(body['distanceDoneMeters']),
        durationSecondsDone: numOrNull(body['durationSecondsDone']),
        effortRir: numOrNull(body['effortRir']),
        effortRpe: numOrNull(body['effortRpe']),
        heartRateDone: numOrNull(body['heartRateDone']),
        heartRateDoneMax: numOrNull(body['heartRateDoneMax']),
        hrMaxPctDone: numOrNull(body['hrMaxPctDone']),
        hrMaxPctDoneMax: numOrNull(body['hrMaxPctDoneMax']),
        hrReservePctDone: numOrNull(body['hrReservePctDone']),
        hrReservePctDoneMax: numOrNull(body['hrReservePctDoneMax']),
        repsDone: numOrNull(body['repsDone']),
        restSecondsDone: numOrNull(body['restSecondsDone']),
        romDone: textOrNull(body['romDone']),
        sessionSportBlockId: item.id,
        setIndex,
        weightDoneKg: numOrNull(body['weightDoneKg']),
      };
  return { ...item, setLogs: upsertIndex(item.setLogs, setIndex, next) };
}

function upsertIndex<T extends { setIndex: number }>(logs: T[], setIndex: number, next: T | null): T[] {
  const rest = logs.filter((entry) => entry.setIndex !== setIndex);
  if (!next) return rest;
  return [...rest, next].sort((left, right) => left.setIndex - right.setIndex);
}

function readTarget(op: SessionOp): { id: string; index: number } | null {
  const [, id, rawIndex] = op.dedupeKey.split(':');
  const index = Number(rawIndex);
  if (!id || !Number.isInteger(index)) return null;
  return { id, index };
}

function clearsLog(body: Record<string, unknown>): boolean {
  return METRIC_KEYS.every((key) => body[key] == null || body[key] === '');
}

function readStartMode(value: unknown): 'INTERACTIVE' | 'TIMER' | null {
  if (value === 'INTERACTIVE' || value === 'TIMER') return value;
  return null;
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  return body as Record<string, unknown>;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
