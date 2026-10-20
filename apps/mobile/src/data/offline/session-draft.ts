import { normalizeLegacyLockedFields, type SessionView } from '@trainerpro/shared';
import { createChunkedStorage, type KvBackend } from '../chunked-storage';

export const SESSION_DRAFT_VERSION = 2;

export type SessionOpKind =
  | 'finish'
  | 'log-interval'
  | 'log-isometric-set'
  | 'log-mobility-set'
  | 'log-plio-set'
  | 'log-set'
  | 'log-sport'
  | 'sport-set'
  | 'start';

export type SessionOp = {
  attempts: number;
  body: unknown;
  createdAt: string;
  dedupeKey: string;
  id: string;
  kind: SessionOpKind;
  path: string;
};

export type ConflictReason = 'access' | 'completed' | 'finish' | 'removed' | 'window';

export type SessionConflict = {
  op: SessionOp;
  reason: ConflictReason;
  status: number;
};

export type SessionDraft = {
  conflicts: SessionConflict[];
  ops: SessionOp[];
  session: SessionView | null;
  sessionDate: string;
  sessionId: string;
  templateVersion: number;
  updatedAt: string;
  version: typeof SESSION_DRAFT_VERSION;
};

export type SessionOpInput = {
  body: unknown;
  dedupeKey: string;
  kind: SessionOpKind;
  path: string;
};

const memoryItems = new Map<string, string>();

export function sessionWritePath(sessionId: string, kind: SessionOpKind, blockId?: string): string {
  if (kind === 'sport-set') {
    return `/sessions/${sessionId}/sport-blocks/${blockId ?? ''}/sets`;
  }
  if (kind === 'log-sport') {
    return `/sessions/${sessionId}/log-sport`;
  }
  return `/sessions/${sessionId}/${kind}`;
}

export function createSessionDraft(session: SessionView, now = new Date().toISOString()): SessionDraft {
  return {
    conflicts: [],
    ops: [],
    session,
    sessionDate: session.sessionDate,
    sessionId: session.id,
    templateVersion: session.templateVersion,
    updatedAt: now,
    version: SESSION_DRAFT_VERSION,
  };
}

export function upsertOp(draft: SessionDraft, input: SessionOpInput, now = new Date().toISOString()): SessionDraft {
  const conflicts = draft.conflicts.filter((conflict) => conflict.op.dedupeKey !== input.dedupeKey);
  const index = draft.ops.findIndex((op) => op.dedupeKey === input.dedupeKey);
  const ops = [...draft.ops];
  if (index >= 0) {
    const previous = ops[index];
    if (previous) {
      ops[index] = { ...previous, ...input, attempts: 0 };
    }
  } else {
    ops.push({ ...input, attempts: 0, createdAt: now, id: createOpId() });
  }
  return { ...draft, conflicts, ops, updatedAt: now };
}

export function withoutConflicts(draft: SessionDraft, now = new Date().toISOString()): SessionDraft {
  return { ...draft, conflicts: [], updatedAt: now };
}

export function isDraftIdle(draft: SessionDraft): boolean {
  return draft.ops.length === 0 && draft.conflicts.length === 0 && draft.session?.status === 'COMPLETED';
}

export async function readSessionDraft(
  sessionId: string,
  backend: KvBackend = defaultDraftBackend(),
): Promise<SessionDraft | null> {
  const raw = await createChunkedStorage(backend).getItem(draftKey(sessionId));
  if (!raw) return null;
  return parseDraft(raw);
}

export async function writeSessionDraft(draft: SessionDraft, backend: KvBackend = defaultDraftBackend()): Promise<void> {
  await createChunkedStorage(backend).setItem(draftKey(draft.sessionId), JSON.stringify(draft));
}

export async function removeSessionDraft(sessionId: string, backend: KvBackend = defaultDraftBackend()): Promise<void> {
  await createChunkedStorage(backend).removeItem(draftKey(sessionId));
}

export async function rememberSession(session: SessionView, backend: KvBackend = defaultDraftBackend()): Promise<void> {
  const current = await readSessionDraft(session.id, backend);
  if (!current) {
    if (session.status === 'COMPLETED') return;
    await writeSessionDraft(createSessionDraft(session), backend);
    return;
  }
  const next: SessionDraft = {
    ...current,
    session,
    sessionDate: session.sessionDate,
    templateVersion: session.templateVersion,
    updatedAt: new Date().toISOString(),
  };
  if (isDraftIdle(next)) {
    await removeSessionDraft(session.id, backend);
    return;
  }
  await writeSessionDraft(next, backend);
}

export function defaultDraftBackend(): KvBackend {
  const storage = (globalThis as unknown as { localStorage?: WebStorage }).localStorage;
  if (storage && typeof storage.getItem === 'function') {
    return wrapWebStorage(storage);
  }
  if (process.env['JEST_WORKER_ID']) {
    return mapBackend(memoryItems);
  }
  return createSecureDraftBackend();
}

function createSecureDraftBackend(): KvBackend {
  return {
    getItem: (key) => readSecureItem(key),
    removeItem: (key) => removeSecureItem(key),
    setItem: (key, value) => writeSecureItem(key, value),
  };
}

async function readSecureItem(key: string): Promise<string | null> {
  const secureStore = await import('expo-secure-store');
  return secureStore.getItemAsync(key);
}

async function writeSecureItem(key: string, value: string): Promise<void> {
  const secureStore = await import('expo-secure-store');
  await secureStore.setItemAsync(key, value);
}

async function removeSecureItem(key: string): Promise<void> {
  const secureStore = await import('expo-secure-store');
  await secureStore.deleteItemAsync(key);
}

type WebStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

function wrapWebStorage(storage: WebStorage): KvBackend {
  return {
    getItem: async (key) => storage.getItem(key),
    removeItem: async (key) => {
      storage.removeItem(key);
    },
    setItem: async (key, value) => {
      storage.setItem(key, value);
    },
  };
}

function mapBackend(items: Map<string, string>): KvBackend {
  return {
    getItem: async (key) => items.get(key) ?? null,
    removeItem: async (key) => {
      items.delete(key);
    },
    setItem: async (key, value) => {
      items.set(key, value);
    },
  };
}

function parseDraft(raw: string): SessionDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Omit<SessionDraft, 'version'>> & { version?: number };
    if ((parsed.version !== 1 && parsed.version !== SESSION_DRAFT_VERSION) || typeof parsed.sessionId !== 'string')
      return null;
    if (!Array.isArray(parsed.ops) || !Array.isArray(parsed.conflicts)) return null;
    if (parsed.version === 1 && parsed.session) {
      parsed.session = {
        ...parsed.session,
        items: parsed.session.items.map((item) => ({
          ...item,
          lockedFields: normalizeLegacyLockedFields(item.type, item.lockedFields),
        })),
      };
    }
    return {
      conflicts: parsed.conflicts,
      ops: parsed.ops,
      session: parsed.session ?? null,
      sessionDate: parsed.sessionDate ?? '',
      sessionId: parsed.sessionId,
      templateVersion: parsed.templateVersion ?? 0,
      updatedAt: parsed.updatedAt ?? '',
      version: SESSION_DRAFT_VERSION,
    };
  } catch {
    return null;
  }
}

function draftKey(sessionId: string): string {
  return `tp.session-draft.${sessionId}`;
}

function createOpId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
