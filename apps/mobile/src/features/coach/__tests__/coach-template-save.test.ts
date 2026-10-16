import { prepareCoachTemplateSaves, saveCoachTemplate, canResumeTemplatePublication } from '../coach-template-save';
import type { CoachWrite } from '../../../data/hooks/useCoachData';

describe('coach template retry', () => {
  const identity = '11111111-1111-4111-8111-111111111111';
  const secondIdentity = '22222222-2222-4222-8222-222222222222';
  it('keeps independent persisted edit and copy request identities', () => {
    let index = 0;
    const saves = prepareCoachTemplateSaves({}, () => [identity, secondIdentity][index++]!);
    expect(saves.edit.clientSaveId).toBe(identity);
    expect(saves.copy.clientSaveId).toBe(secondIdentity);
    expect(prepareCoachTemplateSaves({ templateSaves: saves }, () => 'must-not-change')).toEqual(saves);
  });
  it('permits retry after our version advance while retaining protection against a later external edit', () => {
    const progress = { clientSaveId: identity, attempted: true, publication: { id: 'plan-a', templateVersion: 2 } };
    expect(canResumeTemplatePublication(progress, { id: 'plan-a', templateVersion: 2 })).toBe(true);
    expect(canResumeTemplatePublication(progress, { id: 'plan-a', templateVersion: 3 })).toBe(false);
    expect(canResumeTemplatePublication(progress, { id: 'plan-b', templateVersion: 2 })).toBe(false);
  });
  it('waits for durable request identity before issuing POST', async () => {
    let release!: () => void;
    const persisted = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: CoachWrite[] = [];
    const pending = saveCoachTemplate(
      { kind: 'warmups', payload: { name: 'Warmup' }, progress: { clientSaveId: identity, attempted: false } },
      async (request) => {
        requests.push(request);
        return { id: 'created', templateVersion: 1 };
      },
      () => persisted,
    );
    await Promise.resolve();
    expect(requests).toHaveLength(0);
    release();
    await pending;
    expect(requests).toHaveLength(1);
  });
  it('retries failed routine assignment by patching the published template at its saved version', async () => {
    let progress = { clientSaveId: identity, attempted: false };
    const calls: CoachWrite[] = [];
    let failAssignment = true;
    const write = async (request: CoachWrite) => {
      calls.push(request);
      if (request.path.startsWith('/clients/') && failAssignment) throw new Error('offline');
      return { id: 'created', templateVersion: request.method === 'PATCH' ? 2 : 1 };
    };
    const run = () =>
      saveCoachTemplate({ kind: 'routines', payload: { name: 'Plan' }, progress, clientId: 'client-a' }, write, (next) => {
        progress = next;
      });
    await expect(run()).rejects.toThrow('offline');
    progress = JSON.parse(JSON.stringify(progress));
    failAssignment = false;
    await run();
    expect(calls.map((request) => [request.method, request.path])).toEqual([
      ['POST', '/plans/templates/routines'],
      ['PATCH', '/clients/client-a'],
      ['PATCH', '/plans/templates/routines/created'],
      ['PATCH', '/clients/client-a'],
    ]);
    expect(calls[2]!.body).toMatchObject({ expectedTemplateVersion: 1 });
    expect(progress).toMatchObject({ publication: { id: 'created', templateVersion: 2 } });
  });
  it.each(['routines', 'warmups'] as const)(
    'reuses UUID after a lost %s create response and applies the latest draft',
    async (kind) => {
      let progress = { clientSaveId: identity, attempted: false };
      const calls: CoachWrite[] = [];
      let lost = true;
      const write = async (request: CoachWrite) => {
        calls.push(request);
        if (lost) {
          lost = false;
          throw new Error('response lost');
        }
        return { id: 'created-on-server', templateVersion: request.method === 'PATCH' ? 2 : 1 };
      };
      const run = (name: string) =>
        saveCoachTemplate({ kind, payload: { name }, progress }, write, (next) => {
          progress = next;
        });
      await expect(run('Before')).rejects.toThrow('response lost');
      progress = JSON.parse(JSON.stringify(progress));
      await run('Edited after failure');
      expect(calls.slice(0, 2).map((call) => (call.body as { clientSaveId: string }).clientSaveId)).toEqual([
        identity,
        identity,
      ]);
      expect(calls[2]).toMatchObject({
        method: 'PATCH',
        path: '/plans/templates/' + kind + '/created-on-server',
        body: { name: 'Edited after failure', expectedTemplateVersion: 1 },
      });
    },
  );
});
