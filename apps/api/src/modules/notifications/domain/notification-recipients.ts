export type RecipientToken = {
  clientId: string | null;
  id: string;
  isActive: boolean;
  membershipId: string | null;
  role: 'CLIENT' | 'COACH';
  token: string;
};

export type RecipientPreference = {
  coachMembershipId: string;
  enabled: boolean;
  topic: string;
};

export type RecipientEvent = {
  clientId: string | null;
  coachMembershipId: string | null;
  id: string;
  topic: string;
};

export type PlannedDelivery = {
  deviceTokenId: string;
  eventId: string;
};

export function planDeliveries(
  events: RecipientEvent[],
  tokens: RecipientToken[],
  preferences: RecipientPreference[],
): PlannedDelivery[] {
  return events.flatMap((event) =>
    selectRecipientTokens(event, tokens, preferences).map((token) => ({
      deviceTokenId: token.id,
      eventId: event.id,
    })),
  );
}

export function selectRecipientTokens(
  event: RecipientEvent,
  tokens: RecipientToken[],
  preferences: RecipientPreference[],
): RecipientToken[] {
  const active = tokens.filter((token) => token.isActive);
  if (isClientTopic(event)) {
    return active.filter((token) => token.role === 'CLIENT' && token.clientId !== null && token.clientId === event.clientId);
  }
  if (!preferenceAllows(event, preferences)) {
    return [];
  }
  return active.filter((token) => token.role === 'COACH' && token.membershipId === event.coachMembershipId);
}

function isClientTopic(event: RecipientEvent): boolean {
  return event.topic === 'CLIENT_REMINDER';
}

function preferenceAllows(event: RecipientEvent, preferences: RecipientPreference[]): boolean {
  const row = preferences.find((item) => item.coachMembershipId === event.coachMembershipId && item.topic === event.topic);
  return row?.enabled ?? true;
}
