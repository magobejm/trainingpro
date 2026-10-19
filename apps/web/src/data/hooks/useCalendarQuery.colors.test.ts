import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
type Input = { clientId: string; trainingPlanId: string; planDayId: string; color: string };
type Saved = { planDayId: string; color: string };
const state = vi.hoisted(() => ({
  query: {} as { queryFn: () => Promise<Saved[]> },
  mutation: {} as { mutationFn: (input: Input) => Promise<Saved>; onSuccess: (saved: Saved, input: Input) => void },
  client: null as unknown as QueryClient,
  get: vi.fn(),
  patch: vi.fn(),
}));
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useQuery: (options: typeof state.query) => {
    state.query = options;
    return {};
  },
  useQueryClient: () => state.client,
}));
vi.mock('./useFeedbackMutation', () => ({
  useFeedbackMutation: (options: typeof state.mutation) => {
    state.mutation = options;
    return {};
  },
}));
vi.mock('../api-client', () => ({ createApiClient: () => ({ get: state.get, patch: state.patch }) }));
vi.mock('../../store/auth.store', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select({ accessToken: 'token', activeRole: 'coach' }),
}));
import { useClientRoutineDaysQuery, useSaveRoutineDayColorMutation } from './useCalendarQuery';
const plan = '11111111-1111-4111-8111-111111111111';
function Probe() {
  useClientRoutineDaysQuery(plan, 'one');
  useSaveRoutineDayColorMutation();
  return null;
}
beforeEach(() => {
  state.client = new QueryClient();
  vi.clearAllMocks();
  renderToStaticMarkup(React.createElement(Probe));
});
it('loads saved colors along with the applied routine', async () => {
  state.get.mockImplementation((url: string) =>
    Promise.resolve(
      url.endsWith('/routine-day-colors')
        ? { colors: [{ planDayId: 'day', color: '#fef3c7' }] }
        : { days: [{ id: 'day', dayIndex: 1, title: 'Pull' }] },
    ),
  );
  expect((await state.query.queryFn())[0]!.color).toBe('#fef3c7');
});
it('stores literal colors and updates only the originating client after switching', async () => {
  const a = ['routine-template-days', plan, 'one'];
  const b = ['routine-template-days', plan, 'two'];
  state.client.setQueryData(a, [{ id: 'day', color: '#fff' }]);
  state.client.setQueryData(b, [{ id: 'day', color: '#aaa' }]);
  const input = { clientId: 'one', trainingPlanId: plan, planDayId: 'day', color: '#fef3c7' };
  state.patch.mockResolvedValue({ planDayId: 'day', color: input.color });
  const result = await state.mutation.mutationFn(input);
  state.mutation.onSuccess(result, input);
  expect(state.patch).toHaveBeenCalledWith('/clients/one/routine-day-colors/day', { color: '#fef3c7' });
  expect(state.client.getQueryData<Saved[]>(a)![0]!.color).toBe('#fef3c7');
  expect(state.client.getQueryData<Saved[]>(b)![0]!.color).toBe('#aaa');
});
it('propagates failures without claiming the unsaved color', async () => {
  state.patch.mockRejectedValue(new Error('offline'));
  await expect(
    state.mutation.mutationFn({ clientId: 'one', trainingPlanId: 'plan', planDayId: 'day', color: '#fef3c7' }),
  ).rejects.toThrow('offline');
});
