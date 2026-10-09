import { mapExpoReceipt, mapExpoTicket } from '../../src/modules/notifications/infra/expo/map-expo-ticket';

describe('expo ticket mapping', () => {
  it('keeps a successful ticket id', () => {
    expect(mapExpoTicket({ id: 'ticket-1', status: 'ok' })).toEqual({ id: 'ticket-1', status: 'ok' });
  });

  it('reads the expo error code from an error ticket and receipt', () => {
    const ticket = mapExpoTicket({
      details: { error: 'DeviceNotRegistered' },
      message: 'not registered',
      status: 'error',
    });
    const receipt = mapExpoReceipt({
      details: { error: 'MessageRateExceeded' },
      message: 'slow',
      status: 'error',
    });
    expect(ticket).toEqual({ code: 'DeviceNotRegistered', message: 'not registered', status: 'error' });
    expect(receipt).toEqual({ code: 'MessageRateExceeded', message: 'slow', status: 'error' });
  });
});
