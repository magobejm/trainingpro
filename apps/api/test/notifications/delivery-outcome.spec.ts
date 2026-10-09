import { decideReceiptOutcome, decideTicketOutcome } from '../../src/modules/notifications/domain/delivery-outcome';

const now = new Date('2026-10-09T10:00:00.000Z');

describe('delivery outcome', () => {
  it('marks a successful ticket as sent', () => {
    const decision = decideTicketOutcome({ id: 'ticket-1', status: 'ok' }, 1, now);
    expect(decision.status).toBe('SENT');
    expect(decision.ticketId).toBe('ticket-1');
    expect(decision.deactivateToken).toBe(false);
  });

  it('deactivates the token when the device is no longer registered', () => {
    const decision = decideTicketOutcome({ code: 'DeviceNotRegistered', message: 'gone', status: 'error' }, 1, now);
    expect(decision).toMatchObject({ deactivateToken: true, status: 'INVALID_TOKEN' });
    const receipt = decideReceiptOutcome({ code: 'DeviceNotRegistered', message: 'gone', status: 'error' });
    expect(receipt).toMatchObject({ deactivateToken: true });
  });

  it('retries transient errors with a growing delay and fails on the fifth attempt', () => {
    const first = decideTicketOutcome({ code: 'MessageRateExceeded', message: 'slow', status: 'error' }, 1, now);
    expect(first.status).toBe('PENDING');
    expect(first.nextAttemptAt.toISOString()).toBe('2026-10-09T10:01:00.000Z');
    const second = decideTicketOutcome({ code: 'NETWORK', message: 'down', status: 'error' }, 2, now);
    expect(second.nextAttemptAt.toISOString()).toBe('2026-10-09T10:05:00.000Z');
    const third = decideTicketOutcome({ code: 'HTTP_5XX', message: 'down', status: 'error' }, 3, now);
    expect(third.nextAttemptAt.toISOString()).toBe('2026-10-09T10:15:00.000Z');
    const fourth = decideTicketOutcome({ code: 'ProviderError', message: 'down', status: 'error' }, 4, now);
    expect(fourth.nextAttemptAt.toISOString()).toBe('2026-10-09T11:00:00.000Z');
    const fifth = decideTicketOutcome({ code: 'MessageRateExceeded', message: 'slow', status: 'error' }, 5, now);
    expect(fifth.status).toBe('FAILED');
  });

  it('does not retry a payload or credential error', () => {
    const tooBig = decideTicketOutcome({ code: 'MessageTooBig', message: 'big', status: 'error' }, 1, now);
    const credentials = decideTicketOutcome({ code: 'InvalidCredentials', message: 'bad', status: 'error' }, 1, now);
    expect(tooBig.status).toBe('FAILED');
    expect(credentials.status).toBe('FAILED');
    expect(tooBig.deactivateToken).toBe(false);
  });

  it('leaves a missing receipt pending', () => {
    expect(decideReceiptOutcome(undefined)).toBe('pending');
  });
});
