export type IncidentActionView = {
  actionType: string;
  createdAt: Date;
  createdBy: string;
  payloadJson: null | Record<string, unknown>;
};

export type IncidentView = {
  adjustmentDraft: null | string;
  clientId: string;
  coachAlertedAt: Date | null;
  coachMembershipId: string;
  coachResponse: null | string;
  createdAt: Date;
  description: string;
  id: string;
  reviewedAt: Date | null;
  sessionId: null | string;
  sessionItemId: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
  tag: null | string;
};
