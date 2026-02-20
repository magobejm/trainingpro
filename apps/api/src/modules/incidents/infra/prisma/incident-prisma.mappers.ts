import type { IncidentActionType, IncidentSeverity } from '@prisma/client';
import type { IncidentActionView, IncidentView } from '../../domain/incident.entity';

type IncidentRow = {
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
  severity: IncidentSeverity;
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
  tag: null | string;
};

export function mapIncident(row: IncidentRow): IncidentView {
  return {
    adjustmentDraft: row.adjustmentDraft,
    clientId: row.clientId,
    coachAlertedAt: row.coachAlertedAt,
    coachMembershipId: row.coachMembershipId,
    coachResponse: row.coachResponse,
    createdAt: row.createdAt,
    description: row.description,
    id: row.id,
    reviewedAt: row.reviewedAt,
    sessionId: row.sessionId,
    sessionItemId: row.sessionItemId,
    severity: row.severity,
    status: row.status,
    tag: row.tag,
  };
}

export function mapAction(row: {
  actionType: IncidentActionType;
  createdAt: Date;
  createdBy: string;
  payloadJson: null | unknown;
}): IncidentActionView {
  return {
    actionType: row.actionType,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    payloadJson: normalizePayload(row.payloadJson),
  };
}

export function mustAlertCoach(severity: IncidentSeverity): boolean {
  return severity === 'CRITICAL' || severity === 'HIGH';
}

function normalizePayload(input: unknown): null | Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  return input as Record<string, unknown>;
}
