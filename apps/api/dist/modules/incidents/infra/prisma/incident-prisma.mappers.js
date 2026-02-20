"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapIncident = mapIncident;
exports.mapAction = mapAction;
exports.mustAlertCoach = mustAlertCoach;
function mapIncident(row) {
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
function mapAction(row) {
    return {
        actionType: row.actionType,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        payloadJson: normalizePayload(row.payloadJson),
    };
}
function mustAlertCoach(severity) {
    return severity === 'CRITICAL' || severity === 'HIGH';
}
function normalizePayload(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return null;
    }
    return input;
}
