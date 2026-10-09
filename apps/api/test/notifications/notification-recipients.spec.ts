import {
  planDeliveries,
  selectRecipientTokens,
  type RecipientPreference,
  type RecipientToken,
} from '../../src/modules/notifications/domain/notification-recipients';

const coachToken: RecipientToken = {
  clientId: null,
  id: 'token-coach',
  isActive: true,
  membershipId: 'coach-1',
  role: 'COACH',
  token: 'ExponentPushToken[coach]',
};
const clientToken: RecipientToken = {
  clientId: 'client-1',
  id: 'token-client',
  isActive: true,
  membershipId: null,
  role: 'CLIENT',
  token: 'ExponentPushToken[client]',
};

describe('notification recipients', () => {
  it('sends coach topics only when the preference is enabled or missing', () => {
    const disabled: RecipientPreference = {
      coachMembershipId: 'coach-1',
      enabled: false,
      topic: 'SESSION_COMPLETED',
    };
    const event = {
      clientId: 'client-1',
      coachMembershipId: 'coach-1',
      id: 'event-1',
      topic: 'SESSION_COMPLETED',
    };
    expect(selectRecipientTokens(event, [coachToken, clientToken], [disabled])).toEqual([]);
    expect(selectRecipientTokens(event, [coachToken], [])).toEqual([coachToken]);
  });

  it('sends a client reminder to the client device, not the coach', () => {
    const event = {
      clientId: 'client-1',
      coachMembershipId: 'coach-1',
      id: 'event-2',
      topic: 'CLIENT_REMINDER',
    };
    expect(selectRecipientTokens(event, [coachToken, clientToken], [])).toEqual([clientToken]);
  });

  it('plans one delivery row per event and device', () => {
    const event = {
      clientId: null,
      coachMembershipId: 'coach-1',
      id: 'event-5',
      topic: 'INCIDENT_CRITICAL',
    };
    expect(planDeliveries([event, event], [coachToken], [])).toEqual([
      { deviceTokenId: 'token-coach', eventId: 'event-5' },
      { deviceTokenId: 'token-coach', eventId: 'event-5' },
    ]);
  });
});
