import { BadRequestException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek } from '@prisma/client';
import { targetWeeks } from '../../src/modules/client-routines/client-routine-progression';

const week = (weekIndex: number): ClientRoutineWeek =>
  ({ clientRoutineId: 'r', id: `w${weekIndex}`, weekIndex, startsOn: new Date(), templateId: `t${weekIndex}` }) as never;

const routine = { weeks: [1, 2, 3, 4].map(week) } as unknown as ClientRoutine & { weeks: ClientRoutineWeek[] };
const base = { cascade: false, dayIndexes: [], rules: [] };

describe('targetWeeks', () => {
  it('returns only the chosen weeks without cascade', () => {
    expect(targetWeeks(routine, { ...base, weekIds: ['w2'] }).map((item) => item.weekIndex)).toEqual([2]);
  });

  it('adds every later week when cascading, but never earlier ones', () => {
    const result = targetWeeks(routine, { ...base, cascade: true, weekIds: ['w2'] });
    expect(result.map((item) => item.weekIndex)).toEqual([2, 3, 4]);
  });

  it('does not repeat weeks that were already selected', () => {
    const result = targetWeeks(routine, { ...base, cascade: true, weekIds: ['w1', 'w3'] });
    expect(result.map((item) => item.weekIndex)).toEqual([1, 3, 4]);
  });

  it('rejects weeks that do not belong to the routine', () => {
    expect(() => targetWeeks(routine, { ...base, weekIds: ['w2', 'other'] })).toThrow(BadRequestException);
  });
});
