const META_MARKER = '[meta]';

export type ParsedMetaNotes = {
  baseNotes: null | string;
  meta: Record<string, unknown>;
};

export function parseMetaNotes(notes: null | string | undefined): ParsedMetaNotes {
  if (typeof notes !== 'string' || !notes.trim()) {
    return { baseNotes: null, meta: {} };
  }

  const markerIndex = notes.lastIndexOf(META_MARKER);
  if (markerIndex < 0) {
    const clean = notes.trim();
    return { baseNotes: clean || null, meta: {} };
  }

  const baseNotes = notes.slice(0, markerIndex).trim() || null;
  const jsonPart = notes.slice(markerIndex + META_MARKER.length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { baseNotes, meta: {} };
    }
    return { baseNotes, meta: parsed as Record<string, unknown> };
  } catch {
    return { baseNotes: notes.trim() || null, meta: {} };
  }
}

export function stripMetaNotes(notes: null | string | undefined): null | string {
  return parseMetaNotes(notes).baseNotes;
}
