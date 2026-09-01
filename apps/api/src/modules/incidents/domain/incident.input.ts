export type CreateIncidentInput = {
  description: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  tag?: null | string;
};

export type IncidentListQuery = {
  clientId?: string;
  status?: 'CLOSED' | 'OPEN' | 'REVIEWED';
};
