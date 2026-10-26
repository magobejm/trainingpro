import { BadRequestException } from '@nestjs/common';
import { ClientProductivityService } from '../../../src/modules/clients/application/services/client-productivity.service';

const OWN_A = '11111111-1111-4111-8111-111111111111';
const OWN_B = '22222222-2222-4222-8222-222222222222';
const FOREIGN = '33333333-3333-4333-8333-333333333333';
const context = { subject: 'coach-uid' } as never;

function build(updateClient: jest.Mock) {
  const prisma = {
    client: {
      findFirst: jest.fn().mockResolvedValue({ firstName: 'Ana' }),
      findMany: jest.fn().mockResolvedValue([{ id: OWN_A }, { id: OWN_B }]),
    },
    organizationMember: { findFirst: jest.fn().mockResolvedValue({ id: 'm1', organizationId: 'o1' }) },
  };
  const service = new ClientProductivityService(
    {} as never,
    { execute: jest.fn() } as never,
    {} as never,
    prisma as never,
    {} as never,
    { execute: jest.fn() } as never,
    { execute: updateClient } as never,
  );
  return { prisma, service };
}

describe('ClientProductivityService.bulk', () => {
  it('rejects more than 100 clients', async () => {
    const { service } = build(jest.fn());
    const ids = Array.from({ length: 101 }, (_, index) => `${index}`);
    await expect(service.bulk(context, ids, { action: 'assignRoutine', templateId: 't' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not run foreign clients, dedupes and keeps going after a failure', async () => {
    const updateClient = jest.fn().mockImplementation((_ctx: unknown, id: string) => {
      if (id === OWN_B) throw new Error('boom');
      return Promise.resolve();
    });
    const { service } = build(updateClient);
    const { results } = await service.bulk(context, [OWN_A, OWN_A, FOREIGN, OWN_B], {
      action: 'assignRoutine',
      templateId: 'tpl',
    });
    expect(results).toEqual([
      { clientId: OWN_A, status: 'ok' },
      { clientId: FOREIGN, message: 'Client not found', status: 'error' },
      { clientId: OWN_B, message: 'boom', status: 'error' },
    ]);
    expect(updateClient).toHaveBeenCalledTimes(2);
  });
});
