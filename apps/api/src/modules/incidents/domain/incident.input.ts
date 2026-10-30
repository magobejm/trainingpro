export type CreateIncidentInput = {
  category: 'EXERCISE' | 'OTHER';
  description: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  tag?: null | string;
};

export type IncidentListQuery = {
  category?: 'EXERCISE' | 'OTHER';
  clientId?: string;
  status?: 'CLOSED' | 'OPEN' | 'REVIEWED';
};
