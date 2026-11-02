import {
  handoffTransaction,
  handoffTransactionOptions,
} from '../../src/modules/calendar/infra/prisma/routine-handoff.prisma';

describe('routine handoff transaction', () => {
  it('allows the client-routine clone to finish past the 5s Prisma default', async () => {
    const options: unknown[] = [];
    const prisma = {
      $transaction: async (run: (tx: unknown) => Promise<unknown>, given: unknown) => {
        options.push(given);
        return run({});
      },
    };
    await expect(handoffTransaction(prisma as never, async () => 'assigned')).resolves.toBe('assigned');
    expect(options).toEqual([
      expect.objectContaining({
        maxWait: handoffTransactionOptions.maxWait,
        timeout: handoffTransactionOptions.timeout,
      }),
    ]);
    expect(handoffTransactionOptions.timeout).toBeGreaterThan(5_000);
  });
});
