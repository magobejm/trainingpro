type DeleteFn = (id: string) => Promise<unknown>;

const KIND_TO_KEY = {
  cardio: 'cardio',
  exercise: 'exercise',
  isometric: 'isometric',
  plio: 'plio',
  sport: 'sport',
  warmup: 'warmup',
} as const;

type Kind = keyof typeof KIND_TO_KEY;

export function runLibraryDelete(kind: string, id: string, mutations: Record<Kind, DeleteFn>): Promise<unknown> {
  if (!isKind(kind)) return Promise.resolve();
  return mutations[kind](id);
}

export function formatLibraryDeleteError(
  error: unknown,
  name: string,
  t: (key: string, options?: { name: string }) => string,
): string {
  const raw = readApiErrorMessage(error);
  if (raw.toLowerCase().includes('routine template')) {
    return t('coach.library.exercises.actions.deleteInRoutineError', { name });
  }
  return raw || t('coach.library.exercises.actions.deleteFailed');
}

function isKind(kind: string): kind is Kind {
  return kind in KIND_TO_KEY;
}

function readApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    if (typeof parsed.message === 'string') return parsed.message;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
  } catch {
    return raw;
  }
  return raw;
}
