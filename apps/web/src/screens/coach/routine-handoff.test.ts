import { describe, expect, it, vi } from 'vitest';
import { assignClientRoutine, isSameAssignedRoutine, localCalendarDay } from './routine-handoff';
import { isHandoffConflict } from './useRoutineHandoffReview';
import { ApiClientError } from '../../data/api-client';

const options = { routineHandoff: { mode: 'replace' as const, from: '2026-10-16', expectedSignature: 'a'.repeat(64) } };
function setup() {
  return {
    clientId: 'client',
    clientName: 'Ana',
    routineName: 'Fuerza',
    sameRoutine: false,
    assign: vi.fn().mockResolvedValue(undefined),
    openCalendar: vi.fn(),
    ask: vi.fn().mockResolvedValue(false),
  };
}
describe('routine handoff', () => {
  it('cancel does not assign or navigate', async () => {
    const input = setup();
    await assignClientRoutine(input);
    expect(input.ask).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client', clientName: 'Ana', routineName: 'Fuerza' }),
    );
    expect(input.assign).not.toHaveBeenCalled();
    expect(input.openCalendar).not.toHaveBeenCalled();
  });
  it('submits the reviewed signature and only navigates after success', async () => {
    const input = setup();
    input.ask.mockImplementation(async (request) => {
      await request.submit(options);
      return true;
    });
    await assignClientRoutine(input);
    expect(input.assign).toHaveBeenCalledWith(options);
    expect(input.openCalendar).toHaveBeenCalledOnce();
  });
  it('reviews the same template too because its version may have changed', async () => {
    const input = { ...setup(), sameRoutine: true };
    await assignClientRoutine(input);
    expect(input.ask).toHaveBeenCalledOnce();
    expect(input.assign).not.toHaveBeenCalled();
    expect(input.openCalendar).not.toHaveBeenCalled();
  });
  it('does not navigate after a failed confirmation', async () => {
    const input = setup();
    input.assign.mockRejectedValue(new Error('offline'));
    input.ask.mockImplementation(async (request) => {
      await request.submit(options);
      return true;
    });
    await expect(assignClientRoutine(input)).rejects.toThrow('offline');
    expect(input.openCalendar).not.toHaveBeenCalled();
  });
  it('recognizes only handoff conflicts for automatic preview refresh', () => {
    expect(isHandoffConflict(new ApiClientError('changed', 409, undefined, 'ROUTINE_HANDOFF_CHANGED'))).toBe(true);
    expect(isHandoffConflict(new ApiClientError('other conflict', 409))).toBe(false);
    expect(isHandoffConflict(new ApiClientError('network', 500))).toBe(false);
  });
  it('normalizes IDs and uses a local day boundary', () => {
    expect(isSameAssignedRoutine('ABCDEF1234567890ABCDEF1234567890', null, 'abcdef12-3456-7890-abcd-ef1234567890')).toBe(
      true,
    );
    expect(localCalendarDay(new Date(2026, 9, 16, 23, 59))).toBe('2026-10-16');
  });
});
