import { clearCoachDrafts, draftGeneration, readCoachDraft, saveCoachDraft, removeCoachDraft } from '../coach-draft-storage';
import { coachContextKey } from '../coach-draft-policy';
describe('coach draft persistence', () => {
  it('rejects a late publication marker from an older editor without replacing the reopened draft', async () => {
    const key = coachContextKey('coach-a', 'coach', 'publication-race');
    const session = draftGeneration();
    await saveCoachDraft(key, 'old', session);
    await saveCoachDraft(key, 'new editor work', session);
    await expect(saveCoachDraft(key, 'old with published id', session, 'old')).rejects.toThrow('another editor');
    expect(await readCoachDraft(key)).toBe('new editor work');
  });
  it('a completed older save cannot remove edits from a reopened editor', async () => {
    const key = coachContextKey('coach-a', 'coach', 'routine-race');
    const session = draftGeneration();
    await saveCoachDraft(key, 'sent to server', session);
    await saveCoachDraft(key, 'newer unsaved work', session);
    expect(await removeCoachDraft(key, 'sent to server', session)).toBe(false);
    expect(await readCoachDraft(key)).toBe('newer unsaved work');
    expect(await removeCoachDraft(key, 'newer unsaved work', session)).toBe(true);
    expect(await readCoachDraft(key)).toBeNull();
  });
  it('reopening an editor waits for the previous asynchronous save', async () => {
    const key = coachContextKey('coach-a', 'coach', 'pending-save');
    const pending = saveCoachDraft(key, 'latest pending edit', draftGeneration());
    expect(await readCoachDraft(key)).toBe('latest pending edit');
    await pending;
  });
  it('restores draft contents and removes them at logout', async () => {
    const key = coachContextKey('coach-a', 'coach', 'routine');
    await saveCoachDraft(key, JSON.stringify({ name: 'Mi rutina' }), draftGeneration());
    expect(await readCoachDraft(key)).toBe(JSON.stringify({ name: 'Mi rutina' }));
    await clearCoachDrafts();
    expect(await readCoachDraft(key)).toBeNull();
  });
  it('rejects late writes belonging to a session that has logged out', async () => {
    const key = coachContextKey('coach-a', 'coach', 'chat');
    const old = draftGeneration();
    await clearCoachDrafts();
    await saveCoachDraft(key, 'stale private message', old);
    expect(await readCoachDraft(key)).toBeNull();
  });
});
