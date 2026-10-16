import { canAssignCoachNutritionPlan, saveCoachNutritionPlan, nutritionSaveTarget } from '../coach-nutrition-save';
import type { CoachNutritionPlan } from '@trainerpro/shared';
describe('contextual nutrition save', () => {
  it('does not assign another client copy when the previous response was lost after applying it', async () => {
    const source = { id: 'source', clientId: null, name: 'Plan', type: 'LIBRE', content: {} } as CoachNutritionPlan;
    const requests: string[] = [];
    await saveCoachNutritionPlan(
      { id: source.id, clientId: 'client-a', assignAfterSave: true, payload: source },
      async (request) => {
        requests.push(request.path);
        return source;
      },
      () => undefined,
      async () => [{ ...source, id: 'already-assigned', clientId: 'client-a', sourcePlanId: source.id }],
    );
    expect(requests).toEqual(['/nutrition/plans/source']);
  });
  it('retries a failed copy assignment using the published plan, including after draft restoration', async () => {
    const requests: Array<{ path: string; method?: string }> = [];
    const record = { id: 'published-copy', clientId: null } as CoachNutritionPlan;
    let publication: { id: string; clientId?: string } | undefined;
    let fail = true;
    const write = async (request: { path: string; method?: string }) => {
      requests.push(request);
      if (request.path.endsWith('/assign') && fail) throw new Error('offline');
      return record;
    };
    const input = { originalId: 'original', copy: true, clientId: 'client-a' };
    const publish = () =>
      saveCoachNutritionPlan(
        { ...nutritionSaveTarget({ ...input, publication }), payload: { name: 'Copy', type: 'LIBRE' } },
        write,
        (saved) => {
          publication = { id: saved.id, clientId: 'client-a' };
        },
      );
    await expect(publish()).rejects.toThrow('offline');
    publication = JSON.parse(JSON.stringify(publication));
    fail = false;
    await publish();
    expect(requests.map((request) => [request.method ?? 'POST', request.path])).toEqual([
      ['POST', '/nutrition/plans'],
      ['POST', '/nutrition/plans/published-copy/assign'],
      ['PATCH', '/nutrition/plans/published-copy'],
      ['POST', '/nutrition/plans/published-copy/assign'],
    ]);
    expect(nutritionSaveTarget({ ...input, copy: false, publication })).toMatchObject({
      id: 'published-copy',
      clientId: 'client-a',
      assignAfterSave: true,
    });
  });
  it('creates then assigns a new plan in the selected client context', async () => {
    const calls: unknown[] = [];
    const record = { id: 'saved', clientId: null } as CoachNutritionPlan;
    const saved: string[] = [];
    await saveCoachNutritionPlan(
      { clientId: 'client-a', assignAfterSave: true, payload: { name: 'Plan', type: 'LIBRE' } },
      async (request) => {
        calls.push(request);
        return record;
      },
      (plan) => saved.push(plan.id),
    );
    expect(calls).toEqual([
      { path: '/nutrition/plans', method: 'POST', body: { name: 'Plan', type: 'LIBRE' } },
      { path: '/nutrition/plans/saved/assign', body: { clientId: 'client-a' } },
    ]);
    expect(saved).toEqual(['saved']);
  });
  it('cannot reassign an already assigned copy', () => {
    expect(canAssignCoachNutritionPlan({ id: 'assigned', clientId: 'client-a' })).toBe(false);
    expect(canAssignCoachNutritionPlan({ id: 'library', clientId: null })).toBe(true);
  });
});
