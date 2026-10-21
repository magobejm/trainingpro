import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { workoutGuideResponseSchema, type WorkoutGuideResponse, type WorkoutGuideStep } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import {
  advanceGuideEntry,
  effectiveGuide,
  emptyGuideEntry,
  guideAfterSetSave,
  guideScope,
  reconcileGuideEntry,
  replayGuideEntry,
  type GuideEntry,
} from '../first-workout-guide.state';
import { updateStoredGuide } from '../first-workout-guide.storage';

const path = '/clients/me/first-workout-guide';

export function useWorkoutGuideController() {
  const userId = useAuthStore((s) => s.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeRole = useAuthStore((s) => s.activeRole);
  const environment = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const scope = guideScope(environment, userId ?? 'signed-out');
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [local, setLocal] = useState<{ scope: string; entry: GuideEntry } | null>(null);
  const [error, setError] = useState(false);
  const running = useMemo(() => ({ value: false }), [scope, accessToken]);
  const enabled = Boolean(userId && accessToken && activeRole === 'client');
  const publish = useCallback(
    (entry: GuideEntry) => {
      if (currentScope.current === scope) setLocal({ scope, entry });
    },
    [scope],
  );
  const refresh = useCallback(async () => {
    if (!enabled || running.value) return;
    running.value = true;
    try {
      const api = createApiClient({ activeRole: 'client', accessToken: accessToken ?? undefined });
      const remote = workoutGuideResponseSchema.parse(await api.get<WorkoutGuideResponse>(path));
      let entry = await updateStoredGuide(scope, (stored) => reconcileGuideEntry(stored, remote));
      publish(entry);
      if (entry.pending) {
        const response = workoutGuideResponseSchema.parse(await api.patch(path, entry.pending));
        entry = await updateStoredGuide(scope, (stored) => reconcileGuideEntry(stored, response));
        publish(entry);
      }
      if (currentScope.current === scope) setError(false);
    } catch {
      if (currentScope.current === scope) setError(true);
    } finally {
      running.value = false;
    }
  }, [accessToken, enabled, publish, running, scope]);
  const change = useCallback(
    async (update: (entry: GuideEntry) => GuideEntry) => {
      if (!enabled) return false;
      try {
        publish(await updateStoredGuide(scope, update));
        void refresh();
        return true;
      } catch {
        if (currentScope.current === scope) setError(true);
        return false;
      }
    },
    [enabled, publish, refresh, scope],
  );
  useEffect(() => {
    if (!enabled) return;
    void updateStoredGuide(scope, (stored) => stored)
      .then(publish)
      .catch(() => setError(true));
    void refresh();
    const timer = setInterval(() => void refresh(), 20_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, publish, refresh, scope]);
  const entry = local?.scope === scope ? local.entry : emptyGuideEntry();
  const guide = effectiveGuide(entry);
  return {
    guide,
    error,
    paused: entry.paused,
    replaying: entry.replayStep != null,
    hydrated: enabled && local?.scope === scope,
    pending: entry.pending != null,
    refresh,
    advance: (step: WorkoutGuideStep) =>
      change((stored) => advanceGuideEntry(stored, { version: 1, status: 'in_progress', step })),
    complete: () => change((stored) => advanceGuideEntry(stored, { version: 1, status: 'completed', step: 'help' })),
    dismiss: () =>
      change((stored) => advanceGuideEntry(stored, { version: 1, status: 'dismissed', step: effectiveGuide(stored).step })),
    pause: () => change((stored) => ({ ...stored, paused: true })),
    resume: () => change((stored) => ({ ...stored, paused: false })),
    startFromHelp: () => change(replayGuideEntry),
    recordSaved: (result: unknown, payload: object) => change((stored) => guideAfterSetSave(stored, result, payload)),
  };
}
