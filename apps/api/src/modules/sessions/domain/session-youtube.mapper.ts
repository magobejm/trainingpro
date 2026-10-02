import type { SessionInstance } from './session.entity';

export type LibraryYoutubeRow = {
  id: string;
  youtubeUrl: null | string;
};

export type SessionYoutubeLookupInput = {
  cardio: Array<{ id: string; sourceCardioMethodId: null | string }>;
  isometric: Array<{ id: string; sourceIsometricExerciseId: null | string }>;
  library: {
    cardioMethods: LibraryYoutubeRow[];
    exercises: LibraryYoutubeRow[];
    isometricExercises: LibraryYoutubeRow[];
    mobilityExercises: LibraryYoutubeRow[];
    plioExercises: LibraryYoutubeRow[];
    sports: LibraryYoutubeRow[];
  };
  mobility: Array<{ id: string; sourceMobilityExerciseId: null | string }>;
  plio: Array<{ id: string; sourcePlioExerciseId: null | string }>;
  sport: Array<{ id: string; sourceSportId: null | string }>;
  strength: Array<{ id: string; sourceExerciseId: null | string }>;
};

function indexYoutubeUrls(rows: LibraryYoutubeRow[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const row of rows) {
    const url = row.youtubeUrl?.trim();
    if (url) lookup.set(row.id, url);
  }
  return lookup;
}

function assignYoutubeUrl(
  lookup: Map<string, string>,
  itemId: string,
  sourceId: null | string,
  library: Map<string, string>,
): void {
  if (!sourceId) return;
  const url = library.get(sourceId);
  if (url) lookup.set(itemId, url);
}

export function buildSessionYoutubeLookup(input: SessionYoutubeLookupInput): Map<string, string> {
  const exercises = indexYoutubeUrls(input.library.exercises);
  const cardioMethods = indexYoutubeUrls(input.library.cardioMethods);
  const plioExercises = indexYoutubeUrls(input.library.plioExercises);
  const mobilityExercises = indexYoutubeUrls(input.library.mobilityExercises);
  const isometricExercises = indexYoutubeUrls(input.library.isometricExercises);
  const sports = indexYoutubeUrls(input.library.sports);
  const lookup = new Map<string, string>();

  for (const item of input.strength) {
    assignYoutubeUrl(lookup, item.id, item.sourceExerciseId, exercises);
  }
  for (const item of input.cardio) {
    assignYoutubeUrl(lookup, item.id, item.sourceCardioMethodId, cardioMethods);
  }
  for (const item of input.plio) {
    assignYoutubeUrl(lookup, item.id, item.sourcePlioExerciseId, plioExercises);
  }
  for (const item of input.mobility) {
    assignYoutubeUrl(lookup, item.id, item.sourceMobilityExerciseId, mobilityExercises);
  }
  for (const item of input.isometric) {
    assignYoutubeUrl(lookup, item.id, item.sourceIsometricExerciseId, isometricExercises);
  }
  for (const item of input.sport) {
    assignYoutubeUrl(lookup, item.id, item.sourceSportId, sports);
  }

  return lookup;
}

export function attachSessionYoutubeUrls(session: SessionInstance, lookup: Map<string, string>): SessionInstance {
  return {
    ...session,
    items: session.items.map((item) => ({
      ...item,
      youtubeUrl: lookup.get(item.id) ?? item.youtubeUrl ?? null,
    })),
  };
}
