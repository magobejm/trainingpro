import {
  emptyGuideEntry,
  guideScope,
  advanceGuideEntry,
  reconcileGuideEntry,
  effectiveGuide,
  guideAfterSetSave,
} from '../first-workout-guide.state';
import { initialWorkoutGuide } from '@trainerpro/shared';

describe('offline workout guide', () => {
  it('ignores a stale GET received after known account completion', () => {
    const completed = reconcileGuideEntry(emptyGuideEntry(), {
      version: 1,
      status: 'completed',
      step: 'help',
      eligibleForAutoStart: false,
    });
    const stale = reconcileGuideEntry(completed, {
      version: 1,
      status: 'in_progress',
      step: 'record',
      eligibleForAutoStart: true,
    });
    expect(effectiveGuide(stale).status).toBe('completed');
    expect(effectiveGuide(stale).eligibleForAutoStart).toBe(false);
  });
  it('does not queue stale actions after another device has completed the guide', () => {
    const entry = reconcileGuideEntry(emptyGuideEntry(), {
      version: 1,
      status: 'completed',
      step: 'help',
      eligibleForAutoStart: false,
    });
    expect(advanceGuideEntry(entry, { version: 1, status: 'in_progress', step: 'save' }).pending).toBeNull();
  });
  it('keeps a paused guide paused when another set is saved', () => {
    const entry = {
      ...advanceGuideEntry(emptyGuideEntry(), {
        version: 1,
        status: 'in_progress',
        step: 'save',
      }),
      paused: true,
    };
    expect(guideAfterSetSave(entry, 'synced', { repsDone: 8 })).toEqual(entry);
  });
  it('advances only after a real nonempty set save, including zero and partial distance or RIR', () => {
    const entry = advanceGuideEntry(emptyGuideEntry(), { version: 1, status: 'in_progress', step: 'save' });
    for (const payload of [{ distanceDoneMeters: 1250 }, { effortRir: 0 }, { repsDone: 0 }]) {
      expect(effectiveGuide(guideAfterSetSave(entry, 'pending', payload)).step).toBe('sync');
      expect(effectiveGuide(guideAfterSetSave(entry, 'synced', payload)).step).toBe('sync');
    }
    for (const outcome of ['conflict', 'missing', undefined]) {
      expect(guideAfterSetSave(entry, outcome, { repsDone: 8 })).toEqual(entry);
    }
    expect(guideAfterSetSave(entry, 'synced', { repsDone: null, setIndex: 1 })).toEqual(entry);
  });
  it('does not invent eligibility before a server response', () => {
    expect(effectiveGuide(emptyGuideEntry()).eligibleForAutoStart).toBe(false);
  });
  it('keeps offline progress when the server is behind and acknowledges it after sync', () => {
    const local = advanceGuideEntry(emptyGuideEntry(), { version: 1, status: 'in_progress', step: 'sync' });
    const merged = reconcileGuideEntry(local, { ...initialWorkoutGuide, eligibleForAutoStart: true });
    expect(effectiveGuide(merged).step).toBe('sync');
    expect(merged.pending?.step).toBe('sync');
    expect(reconcileGuideEntry(merged, { ...merged.pending!, eligibleForAutoStart: true }).pending).toBeNull();
  });
  it('respects completion on another device over queued progress', () => {
    const local = advanceGuideEntry(emptyGuideEntry(), { version: 1, status: 'in_progress', step: 'record' });
    const merged = reconcileGuideEntry(local, {
      version: 1,
      status: 'completed',
      step: 'help',
      eligibleForAutoStart: false,
    });
    expect(effectiveGuide(merged).status).toBe('completed');
    expect(merged.pending).toBeNull();
  });
  it('replays locally without resetting a completed account', () => {
    const entry = {
      ...emptyGuideEntry(),
      server: {
        version: 1 as const,
        status: 'completed' as const,
        step: 'help' as const,
        eligibleForAutoStart: false,
      },
      replayStep: 'overview' as const,
    };
    const replay = advanceGuideEntry(entry, { version: 1, status: 'in_progress', step: 'record' });
    expect(effectiveGuide(replay).step).toBe('record');
    expect(replay.server?.status).toBe('completed');
    expect(replay.pending).toBeNull();
    expect(advanceGuideEntry(replay, { version: 1, status: 'completed', step: 'help' }).replayStep).toBeNull();
  });
  it('isolates environments and users with secure-store compatible keys', () => {
    const key = guideScope('http://localhost:8080/', 'user-1');
    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(key).toBe(guideScope('http://localhost:8080', 'user-1'));
    expect(key).not.toBe(guideScope('https://api.example.com', 'user-1'));
    expect(key).not.toBe(guideScope('http://localhost:8080', 'user-2'));
  });
});
