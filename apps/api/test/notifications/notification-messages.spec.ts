import { buildPushMessage } from '../../src/modules/notifications/domain/notification-messages';

describe('notification messages', () => {
  it('builds a spanish session message with the session id', () => {
    const message = buildPushMessage({
      clientId: 'client-1',
      eventId: 'event-1',
      payload: { sessionId: 'session-1' },
      recipientUserId: 'user-1',
      token: 'ExponentPushToken[abc]',
      topic: 'SESSION_COMPLETED',
    });
    expect(message.title).toBe('Sesión completada');
    expect(message.data).toEqual({
      clientId: 'client-1',
      eventId: 'event-1',
      recipientUserId: 'user-1',
      sessionId: 'session-1',
      topic: 'SESSION_COMPLETED',
    });
    expect(message.channelId).toBe('default');
  });

  it('uses a generic copy when the topic is unknown', () => {
    const message = buildPushMessage({
      eventId: 'event-2',
      payload: null,
      token: 'ExponentPushToken[abc]',
      topic: 'UNKNOWN',
    });
    expect(message.title).toBe('Trainer Pro');
    expect(message.data.eventId).toBe('event-2');
  });
});
