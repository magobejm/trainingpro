import { expect, it, vi } from 'vitest';
import { buildAssignOnly, buildSaveAndAssign } from './RoutinePlannerScreen.model';

vi.mock('../../layout/list-context', () => ({ writeRouteClientId: vi.fn() }));

const templateId = '11111111-1111-4111-8111-111111111111';
const options = { routineHandoff: { mode: 'replace' as const, from: '2026-10-16', expectedSignature: 'a'.repeat(64) } };
function planner() {
  return {
    ui: { editingId: templateId, setSaveSuccess: vi.fn(), setEditingId: vi.fn() },
    draft: { draft: { sourcePlanTemplateId: templateId }, setDraft: vi.fn(), setActiveDayIdx: vi.fn() },
    work: { release: vi.fn() },
    route: vi.fn(),
  };
}

it('forwards the reviewed options from assign-only in one mutation', async () => {
  const state = planner();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  const assign = buildAssignOnly({ mutateAsync } as never, state.ui as never, state.draft as never, state.route);
  await assign('client', options);
  expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({ clientId: 'client', templateId, ...options });
  expect(state.route).toHaveBeenCalledWith('coach.calendar');
});

it('keeps the saved template and draft when assignment fails, then retries without saving a second template', async () => {
  const state = planner();
  const save = vi.fn().mockResolvedValue(templateId);
  const mutateAsync = vi.fn().mockRejectedValueOnce(new Error('conflict')).mockResolvedValue(undefined);
  const assign = buildSaveAndAssign(
    save,
    { mutateAsync } as never,
    state.draft as never,
    state.ui as never,
    (key) => key,
    state.route,
    state.work as never,
  );
  expect(await assign.prepare('Name')).toBe(templateId);
  expect(state.route).not.toHaveBeenCalled();
  expect(mutateAsync).not.toHaveBeenCalled();
  await expect(assign('Name', 'client', options)).rejects.toThrow('conflict');
  expect(state.work.release).not.toHaveBeenCalled();
  expect(state.draft.setDraft).not.toHaveBeenCalled();
  expect(state.route).not.toHaveBeenCalled();
  await assign('Name', 'client', options);
  expect(save).toHaveBeenCalledOnce();
  expect(mutateAsync).toHaveBeenLastCalledWith({ clientId: 'client', templateId, ...options });
  expect(state.work.release).toHaveBeenCalledOnce();
});
