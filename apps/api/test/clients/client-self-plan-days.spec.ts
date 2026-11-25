import { clientPlanDayBatchResponseSchema } from '@trainerpro/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { parsePlanDayBatch } from '../../src/modules/clients/presentation/controllers/plan-day-batch';
import { ClientSelfController } from '../../src/modules/clients/presentation/controllers/client-self.controller';

describe('parsePlanDayBatch', () => {
  it('reads and deduplicates planDayId@date entries', () => {
    expect(parsePlanDayBatch('a1@2026-11-24, b2@2026-11-25,a1@2026-11-24')).toEqual([
      { on: '2026-11-24', planDayId: 'a1' },
      { on: '2026-11-25', planDayId: 'b2' },
    ]);
  });

  it('rejects empty, malformed and oversized lists', () => {
    expect(() => parsePlanDayBatch(undefined)).toThrow(BadRequestException);
    expect(() => parsePlanDayBatch('a1')).toThrow(BadRequestException);
    expect(() => parsePlanDayBatch('a1@2026-13-1')).toThrow(BadRequestException);
    const many = Array.from({ length: 63 }, (_, index) => 'p' + index + '@2026-11-24').join(',');
    expect(() => parsePlanDayBatch(many)).toThrow(BadRequestException);
  });
});

describe('ClientSelfController.getMyPlanDays', () => {
  const request = { activeRole: 'client', user: { email: 'c@example.com', roles: ['client'], subject: 'u1' } } as never;

  function build(execute: jest.Mock) {
    const controller = Object.create(ClientSelfController.prototype) as ClientSelfController;
    (controller as unknown as { getClientPlanDayUseCase: unknown }).getClientPlanDayUseCase = { execute };
    return controller;
  }

  it('returns the found days and omits the ones that do not exist', async () => {
    const execute = jest.fn(async (_context: unknown, planDayId: string) => {
      if (planDayId === 'missing') throw new NotFoundException('Plan day not found');
      return { id: planDayId };
    });
    const result = await build(execute).getMyPlanDays('a1@2026-11-24,missing@2026-11-24', request);
    expect(result.items).toEqual([{ day: { id: 'a1' }, on: '2026-11-24', planDayId: 'a1' }]);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(clientPlanDayBatchResponseSchema.parse(result)).toEqual(result);
  });

  it('lets unexpected errors through', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('db down'));
    await expect(build(execute).getMyPlanDays('a1@2026-11-24', request)).rejects.toThrow('db down');
  });
});
