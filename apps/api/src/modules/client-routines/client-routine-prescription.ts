import type { RoutineEditorItemKind, RoutineEditorItemMeta } from '@trainerpro/shared';

const META_MARKER = '[meta] ';

type NoteParts = { meta: Record<string, unknown>; text: string };

/** The planner stores a few block settings after the coach's note, behind a marker. */
export function splitPlanNotes(notes: string | null | undefined): NoteParts {
  if (!notes) return { meta: {}, text: '' };
  const at = notes.lastIndexOf(META_MARKER);
  if (at < 0) return { meta: {}, text: notes.trim() };
  const text = notes.slice(0, at).trim();
  try {
    const parsed = JSON.parse(notes.slice(at + META_MARKER.length).trim()) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return { meta: parsed as Record<string, unknown>, text };
  } catch {
    return { meta: {}, text: notes.trim() };
  }
  return { meta: {}, text: notes.trim() };
}

export function joinPlanNotes(text: string, meta: Record<string, unknown>): string | null {
  const clean = Object.fromEntries(Object.entries(meta).filter(([, value]) => value != null && value !== ''));
  const body = text.trim();
  if (Object.keys(clean).length === 0) return body || null;
  return `${body ? `${body}\n` : ''}${META_MARKER}${JSON.stringify(clean)}`;
}

export function formatRepRange(min: unknown, max: unknown): string | null {
  const low = typeof min === 'number' ? min : null;
  const high = typeof max === 'number' ? max : null;
  if (low == null && high == null) return null;
  if (low != null && high != null) return low === high ? String(low) : `${Math.min(low, high)}-${Math.max(low, high)}`;
  return String(low ?? high);
}

function parseRepRange(value: string | null): { repsMax: number | null; repsMin: number | null } {
  if (!value?.trim()) return { repsMax: null, repsMin: null };
  const parts = value.split('-').map((item) => Number(item.trim()));
  const first = parts[0];
  const second = parts[1];
  if (parts.length === 1 && Number.isInteger(first)) return { repsMax: first!, repsMin: first! };
  if (Number.isInteger(first) && Number.isInteger(second)) {
    return { repsMax: Math.max(first!, second!), repsMin: Math.min(first!, second!) };
  }
  return { repsMax: null, repsMin: null };
}

/** Exercise-level values, with the planner's hidden marker removed from the note the coach reads. */
export function readPrescription(kind: RoutineEditorItemKind, row: object) {
  const record = row as Record<string, unknown>;
  const split = splitPlanNotes(typeof record.notes === 'string' ? record.notes : null);
  const fromMeta = typeof split.meta.rangoReps === 'string' ? split.meta.rangoReps : null;
  const repsRange = kind === 'exercise' ? formatRepRange(record.repsMin, record.repsMax) : rangeKind(kind) ? fromMeta : null;
  const durationMinutes = kind === 'sport' && typeof record.durationMinutes === 'number' ? record.durationMinutes : null;
  return { durationMinutes, notes: split.text || null, repsRange };
}

function rangeKind(kind: RoutineEditorItemKind) {
  return kind === 'plio' || kind === 'mobility';
}

/** Column and note changes for one item. Each copy keeps the meta keys this patch does not touch. */
export function prescriptionPatch(kind: RoutineEditorItemKind, row: object, meta: RoutineEditorItemMeta) {
  const data: Record<string, unknown> = {};
  if (meta.lockedFields !== undefined) data.lockedFieldsJson = meta.lockedFields;
  const notes = typeof (row as { notes?: unknown }).notes === 'string' ? (row as { notes: string }).notes : null;
  const split = splitPlanNotes(notes);
  const text = meta.notes !== undefined ? (meta.notes?.trim() ?? '') : split.text;
  const nextMeta = rangeKind(kind) && meta.repsRange !== undefined ? withRange(split.meta, meta.repsRange) : split.meta;
  const touchesNotes = meta.notes !== undefined || (rangeKind(kind) && meta.repsRange !== undefined);
  if (touchesNotes) data.notes = joinPlanNotes(text, nextMeta);
  if (meta.repsRange !== undefined && kind === 'exercise') Object.assign(data, parseRepRange(meta.repsRange));
  if (meta.durationMinutes !== undefined && kind === 'sport') data.durationMinutes = meta.durationMinutes;
  return data;
}

function withRange(meta: Record<string, unknown>, range: string | null) {
  const next = { ...meta };
  if (range) next.rangoReps = range;
  else delete next.rangoReps;
  return next;
}
