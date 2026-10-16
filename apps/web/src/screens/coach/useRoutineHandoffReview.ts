import { useCallback, useEffect, useRef, useState } from 'react';
import { routineHandoffPreviewSchema, type RoutineHandoffPreview } from '@trainerpro/shared';
import { ApiClientError, createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import { localCalendarDay, type RoutineHandoffRequest } from './routine-handoff';

export function isHandoffConflict(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 409 && error.responseText.includes('ROUTINE_HANDOFF_CHANGED');
}

export async function loadRoutineHandoffPreview(clientId: string, from: string) {
  const { accessToken, activeRole } = useAuthStore.getState();
  if (!accessToken || !activeRole) throw new Error('Not authenticated');
  const api = createApiClient({ accessToken, activeRole });
  const health = await api.get<{ capabilities?: { routineHandoffPreview?: boolean } }>('/health');
  if (health.capabilities?.routineHandoffPreview !== true) throw new Error('Routine handoff preview is not available');
  const response = await api.post('/calendar/clear-future-workouts', {
    clientId,
    from,
    dryRun: true,
  });
  return routineHandoffPreviewSchema.parse(response);
}

export function useRoutineHandoffReview(request: RoutineHandoffRequest, onDone: () => void) {
  const [preview, setPreview] = useState<RoutineHandoffPreview | null>(null);
  const [mode, setMode] = useState<'continue' | 'replace'>('continue');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<'load' | 'save' | null>(null);
  const [changed, setChanged] = useState(false);
  const alive = useRef(true);
  const busy = useRef(false);
  const loadSequence = useRef(0);
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError(null);
    try {
      const next = await loadRoutineHandoffPreview(request.clientId, localCalendarDay());
      if (alive.current && sequence === loadSequence.current) setPreview(next);
    } catch {
      if (alive.current && sequence === loadSequence.current) setError('load');
    } finally {
      if (alive.current && sequence === loadSequence.current) setLoading(false);
    }
  }, [request.clientId]);
  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);
  const confirm = async () => {
    if (!preview || loading || error === 'load' || busy.current) return;
    if (preview.from !== localCalendarDay()) {
      setChanged(true);
      await reload();
      return;
    }
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      await request.submit({ routineHandoff: { mode, from: preview.from, expectedSignature: preview.signature } });
      if (alive.current) onDone();
    } catch (failure) {
      if (!alive.current) return;
      if (isHandoffConflict(failure)) {
        setChanged(true);
        await reload();
      } else setError('save');
    } finally {
      busy.current = false;
      if (alive.current) setSaving(false);
    }
  };
  return { canCancel: () => !busy.current, preview, mode, setMode, loading, saving, error, changed, reload, confirm };
}
