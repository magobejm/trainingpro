import type { SessionView } from '@trainerpro/shared';
import { ApiClientError } from '../api-client';
import type { ConflictReason, SessionDraft, SessionOp } from './session-draft';

export type SessionTransport = {
  post: (path: string, body: unknown) => Promise<unknown>;
};

export type FlushOutcome =
  | { kind: 'auth' }
  | { kind: 'conflict'; reason: ConflictReason; status: number }
  | { kind: 'retry' };

export async function flushQueue(transport: SessionTransport, draft: SessionDraft): Promise<SessionDraft> {
  const kept: SessionOp[] = [];
  const conflicts = [...draft.conflicts];
  let session = draft.session;
  for (let index = 0; index < draft.ops.length; index += 1) {
    const op = draft.ops[index];
    if (!op) continue;
    try {
      const response = await transport.post(op.path, op.body);
      if (isSessionSnapshot(response)) session = response;
    } catch (error) {
      const outcome = classifyFlushError(error);
      if (outcome.kind === 'conflict') {
        conflicts.push({ op: { ...op, attempts: op.attempts + 1 }, reason: outcome.reason, status: outcome.status });
        continue;
      }
      const pending = outcome.kind === 'auth' ? draft.ops.slice(index) : bumpHead(draft.ops.slice(index));
      return packDraft(draft, [...kept, ...pending], conflicts, session);
    }
  }
  return packDraft(draft, kept, conflicts, session);
}

export function classifyFlushError(error: unknown): FlushOutcome {
  if (!(error instanceof ApiClientError)) return { kind: 'retry' };
  if (error.status === 401 || error.status >= 500) {
    return error.status === 401 ? { kind: 'auth' } : { kind: 'retry' };
  }
  if (error.status === 400 || error.status === 403 || error.status === 404 || error.status === 409) {
    return { kind: 'conflict', reason: reasonFor(error), status: error.status };
  }
  return { kind: 'retry' };
}

function reasonFor(error: ApiClientError): ConflictReason {
  if (error.message.includes('Session edit window has expired')) return 'window';
  if (error.message.includes('Session access denied')) return 'access';
  if (error.message.includes('Session finish conflict')) return 'finish';
  if (error.message.includes('Session already completed')) return 'completed';
  if (error.status === 404) return 'removed';
  if (error.status === 403) return 'access';
  if (error.status === 409) return 'finish';
  return 'completed';
}

function packDraft(
  draft: SessionDraft,
  ops: SessionOp[],
  conflicts: SessionDraft['conflicts'],
  session: SessionView | null,
): SessionDraft {
  return {
    ...draft,
    conflicts,
    ops,
    session,
    sessionDate: session?.sessionDate ?? draft.sessionDate,
    templateVersion: session?.templateVersion ?? draft.templateVersion,
    updatedAt: new Date().toISOString(),
  };
}

function bumpHead(ops: SessionOp[]): SessionOp[] {
  return ops.map((op, index) => (index === 0 ? { ...op, attempts: op.attempts + 1 } : op));
}

function isSessionSnapshot(value: unknown): value is SessionView {
  if (!value || typeof value !== 'object') return false;
  const record = value as { id?: unknown; items?: unknown; status?: unknown };
  return typeof record.id === 'string' && Array.isArray(record.items) && typeof record.status === 'string';
}
